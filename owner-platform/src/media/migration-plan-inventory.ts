import { createHash } from 'node:crypto'
import { createMigrationPlan, readMigrationPlan, type MigrationPlan } from './migration-plan'

type Failure = 'candidate-invalid' | 'candidate-blocked' | 'inventory-invalid' |
  'inventory-integrity-mismatch' | 'inventory-coverage-mismatch' | 'inventory-metadata-mismatch'

export class MigrationInventoryBindingError extends Error {
  constructor(readonly code: Failure) {
    super(`Migration inventory binding failed: ${code}.`)
    this.name = 'MigrationInventoryBindingError'
  }
}

export type MigrationInventoryBinding = {
  schemaVersion: 1
  status: 'inventory-matched'
  canApply: false
  planDigest: string
  inventoryHash: string
  referenceCount: number
  variantCount: number
}

const fail = (code: Failure): never => { throw new MigrationInventoryBindingError(code) }
const invalid = (): never => fail('inventory-invalid')
const MAX_JSON_BYTES = 8 * 1024 * 1024
const SHA = /^[a-f0-9]{64}$/u
type Row = Record<string, unknown>

function row(value: unknown, required: string[], optional: string[] = []): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  const result = value as Row
  if (required.some(key => !Object.hasOwn(result, key)) ||
    Object.keys(result).some(key => !required.includes(key) && !optional.includes(key))) return invalid()
  return result
}

function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) return invalid()
  return value
}

// Same canonical JSON convention as the inventory producer (sorted object keys,
// preserved array order). Bound recursion before hashing an untrusted artifact.
function canonical(value: unknown, depth = 0): string {
  if (depth > 16) return invalid()
  if (Array.isArray(value)) return '[' + array(value, 160_000).map(x => canonical(x, depth + 1)).join(',') + ']'
  if (value && typeof value === 'object') return '{' + Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => JSON.stringify(key) + ':' + canonical(item, depth + 1)).join(',') + '}'
  if (typeof value === 'number' && !Number.isFinite(value)) return invalid()
  return JSON.stringify(value)
}

/** Bind coverage to an independently pinned inventory artifact from the owner
 * collector. expectedHash must come from a trusted orchestration context, NOT
 * a request's claimed hash. No endpoint/orchestrator is wired up here yet.
 * This proves agreement with the supplied artifact, not that its producer saw
 * the entire DB, ran under a freeze or authenticated historical file evidence.
 * Observational issues remain in the hashed artifact; matching is not approval.
 */
export function bindMigrationPlanInventory(serializedPlan: string, serializedInventory: string,
  expectedHash: string): MigrationInventoryBinding {
  let plan: MigrationPlan
  try { plan = readMigrationPlan(serializedPlan) } catch { return fail('candidate-invalid') }
  if (plan.status === 'blocked') return fail('candidate-blocked')
  if (typeof expectedHash !== 'string' || !SHA.test(expectedHash)) return fail('inventory-integrity-mismatch')
  if (typeof serializedInventory !== 'string' || Buffer.byteLength(serializedInventory) > MAX_JSON_BYTES) return invalid()
  let parsed: unknown
  try { parsed = JSON.parse(serializedInventory) } catch { return invalid() }
  const inventory = row(parsed, ['schemaVersion', 'migrationReady', 'references', 'physicalFiles',
    'unreferencedFiles', 'issues', 'totalObservedBytes', 'hash'])
  if (inventory.schemaVersion !== 1 || inventory.migrationReady !== false) return invalid()
  const { hash, ...body } = inventory
  const observedHash = createHash('sha256').update(canonical(body)).digest('hex')
  if (hash !== expectedHash || observedHash !== expectedHash || plan.sourceInventoryHash !== expectedHash) {
    return fail('inventory-integrity-mismatch')
  }

  // Validate the fields consumed by coverage. Other observational annotations
  // are integrity-bound above, not reinterpreted as historical proof here.
  array(inventory.physicalFiles, 10_000)
  array(inventory.unreferencedFiles, 10_000)
  array(inventory.issues, 160_000)
  if (!Number.isSafeInteger(inventory.totalObservedBytes) || (inventory.totalObservedBytes as number) < 0 ||
    (inventory.totalObservedBytes as number) > 1024 * 1024 * 1024) return invalid()
  const sourceFiles = new Map<string, { filename: unknown; expectedBytes: unknown; revision: unknown }>()
  const projected = array(inventory.references, 10_000).map(raw => {
    const reference = row(raw, ['kind', 'documentId', 'referenceId', 'state', 'files', 'status', 'issues', 'observedFiles'], ['storageRevision'])
    if (!['published', 'draft', 'trashed', 'unknown'].includes(reference.state as string) ||
      !['current-observed', 'historical-unverified', 'versioned-not-inspected', 'incomplete'].includes(reference.status as string)) return invalid()
    const variants = array(reference.files, 16).map(rawFile => {
      const file = row(rawFile, ['variant'], ['filename', 'expectedBytes'])
      const key = JSON.stringify([reference.kind, reference.documentId, reference.referenceId, file.variant])
      if (sourceFiles.has(key)) return invalid()
      sourceFiles.set(key, { filename: file.filename, expectedBytes: file.expectedBytes, revision: reference.storageRevision })
      return file.variant
    })
    return { kind: reference.kind, documentId: reference.documentId, referenceId: reference.referenceId, variants }
  })
  let coverage: MigrationPlan
  try { coverage = createMigrationPlan({ sourceInventoryHash: expectedHash, references: projected, evidence: [] }) }
  catch { return invalid() }
  if (JSON.stringify(coverage.references) !== JSON.stringify(plan.references)) return fail('inventory-coverage-mismatch')
  for (const entry of plan.evidence) {
    const source = sourceFiles.get(JSON.stringify([entry.kind, entry.documentId, entry.referenceId, entry.variant]))!
    if (typeof source.filename !== 'string' || /^unsafe-name-[a-f0-9]{64}$/iu.test(source.filename) ||
      source.filename !== entry.filename ||
      (source.expectedBytes !== undefined && source.expectedBytes !== entry.bytes) ||
      (source.revision !== undefined && source.revision !== entry.revision)) return fail('inventory-metadata-mismatch')
  }

  return { schemaVersion: 1, status: 'inventory-matched', canApply: false,
    planDigest: plan.digest, inventoryHash: expectedHash,
    referenceCount: coverage.references.length, variantCount: sourceFiles.size }
}
