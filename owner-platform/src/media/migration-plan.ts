import { createHash } from 'node:crypto'

type Kind = 'document' | 'draft' | 'version' | 'snapshot'
type Identity = { kind: Kind; documentId: string; referenceId: string }
type Reference = Identity & { variants: string[] }
type Evidence = Identity & {
  variant: string; filename: string; bytes: number; sha256: string
  revision: string; evidenceHash: string
}
export type MigrationPlan = {
  schemaVersion: 1
  canApply: false
  status: 'blocked' | 'awaiting-physical-verification'
  sourceInventoryHash: string
  references: Reference[]
  evidence: Evidence[]
  missing: (Identity & { variant: string })[]
  digest: string
}

const MAX_JSON_BYTES = 8 * 1024 * 1024
const MAX_REVISION_BYTES = 64 * 1024 * 1024
const SHA = /^[a-f0-9]{64}$/u
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u
const fail = (): never => { throw new Error('Invalid or inconsistent migration candidate.') }
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const identityKey = (x: Identity) => JSON.stringify([x.kind, x.documentId, x.referenceId])
const fileKey = (x: Identity & { variant: string }) => JSON.stringify([x.kind, x.documentId, x.referenceId, x.variant])

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail()
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return fail()
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !descriptors[key] || !('value' in descriptors[key]))) return fail()
  return value as Record<string, unknown>
}

function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) return fail()
  for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) return fail()
  return value
}

function id(value: unknown): string {
  // Opaque adapter IDs only; paths, URLs, emails and editorial text are excluded.
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/u.test(value)) return fail()
  return value
}

function hash(value: unknown): string {
  if (typeof value !== 'string' || !SHA.test(value)) return fail()
  return value
}

function identity(value: Record<string, unknown>): Identity {
  if (!['document', 'draft', 'version', 'snapshot'].includes(value.kind as string)) return fail()
  return { kind: value.kind as Kind, documentId: id(value.documentId), referenceId: id(value.referenceId) }
}

function filename(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || Buffer.byteLength(value) > 255 ||
    /[\p{Cc}\\/:]/u.test(value) || /[. ]$/u.test(value) ||
    /^(?:aux|con|nul|prn|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(value) ||
    value.toLowerCase() === 'manifest.json' || value === '.' || value === '..' || value.includes('@') ||
    Buffer.from(value).toString('utf8') !== value) return fail()
  return value
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value && typeof value === 'object') return '{' + Object.entries(value)
    .sort(([a], [b]) => compare(a, b)).map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}'
  return JSON.stringify(value)
}

/** Pure metadata reconciliation. A matching digest is NOT historical proof or permission.
 * No DB, filesystem, network, public endpoint or migration executor is connected here.
 * The caller must later prove that the supplied reference set matches a frozen inventory.
 */
export function createMigrationPlan(input: unknown): MigrationPlan {
  const value = object(input, ['sourceInventoryHash', 'references', 'evidence'])
  const sourceInventoryHash = hash(value.sourceInventoryHash)
  const identities = new Set<string>()
  const expected = new Map<string, Identity & { variant: string }>()
  const references = array(value.references, 10_000).map(raw => {
    const row = object(raw, ['kind', 'documentId', 'referenceId', 'variants'])
    const ref = identity(row)
    const key = identityKey(ref)
    if (identities.has(key)) return fail()
    identities.add(key)
    const variants = array(row.variants, 16).map(id).sort(compare)
    if (!variants.length || new Set(variants).size !== variants.length) return fail()
    for (const variant of variants) expected.set(fileKey({ ...ref, variant }), { ...ref, variant })
    return { ...ref, variants }
  }).sort((a, b) => compare(identityKey(a), identityKey(b)))

  const seen = new Set<string>()
  const revisionFiles = new Map<string, Map<string, Evidence>>()
  const evidence = array(value.evidence, 160_000).map(raw => {
    const row = object(raw, ['kind', 'documentId', 'referenceId', 'variant', 'filename', 'bytes', 'sha256', 'revision', 'evidenceHash'])
    const ref = identity(row)
    const variant = id(row.variant)
    const key = fileKey({ ...ref, variant })
    if (!expected.has(key) || seen.has(key)) return fail()
    seen.add(key)
    if (!Number.isSafeInteger(row.bytes) || (row.bytes as number) <= 0 || (row.bytes as number) > MAX_REVISION_BYTES ||
      typeof row.revision !== 'string' || !UUID.test(row.revision)) return fail()
    const entry: Evidence = { ...ref, variant, filename: filename(row.filename), bytes: row.bytes as number,
      sha256: hash(row.sha256), revision: row.revision, evidenceHash: hash(row.evidenceHash) }
    const files = revisionFiles.get(entry.revision) ?? new Map<string, Evidence>()
    const canonicalName = entry.filename.normalize('NFC').toLowerCase()
    const previous = files.get(canonicalName)
    if (previous && (previous.filename !== entry.filename || previous.bytes !== entry.bytes || previous.sha256 !== entry.sha256)) return fail()
    files.set(canonicalName, entry)
    revisionFiles.set(entry.revision, files)
    return entry
  }).sort((a, b) => compare(fileKey(a), fileKey(b)))

  let totalBytes = 0
  let totalFiles = 0
  for (const files of revisionFiles.values()) {
    const bytes = [...files.values()].reduce((sum, file) => sum + file.bytes, 0)
    if (files.size > 16 || bytes > MAX_REVISION_BYTES) return fail()
    totalBytes += bytes
    totalFiles += files.size
  }
  if (totalBytes > 1024 * 1024 * 1024 || totalFiles > 10_000) return fail()
  const missing = [...expected.entries()].filter(([key]) => !seen.has(key)).map(([, item]) => item)
    .sort((a, b) => compare(fileKey(a), fileKey(b)))
  const body: Omit<MigrationPlan, 'digest'> = {
    schemaVersion: 1, canApply: false,
    status: missing.length || references.length === 0 ? 'blocked' : 'awaiting-physical-verification',
    sourceInventoryHash, references, evidence, missing,
  }
  const serialized = canonical(body)
  if (Buffer.byteLength(serialized) + 80 > MAX_JSON_BYTES) return fail()
  return { ...body, digest: createHash('sha256').update(serialized).digest('hex') }
}

export function readMigrationPlan(serialized: string): MigrationPlan {
  if (typeof serialized !== 'string' || Buffer.byteLength(serialized) > MAX_JSON_BYTES) return fail()
  let parsed: unknown
  try { parsed = JSON.parse(serialized) } catch { return fail() }
  const value = object(parsed, ['schemaVersion', 'canApply', 'status', 'sourceInventoryHash', 'references', 'evidence', 'missing', 'digest'])
  const rebuilt = createMigrationPlan({ sourceInventoryHash: value.sourceInventoryHash, references: value.references, evidence: value.evidence })
  // Compare only against the bounded, generated envelope; never recursively traverse
  // attacker-controlled "missing" values or consider their claimed readiness valid.
  if (value.schemaVersion !== rebuilt.schemaVersion || value.canApply !== false || value.status !== rebuilt.status ||
    value.digest !== rebuilt.digest || JSON.stringify(value.missing) !== JSON.stringify(rebuilt.missing)) return fail()
  return rebuilt
}
