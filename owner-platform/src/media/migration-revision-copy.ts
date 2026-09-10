import type { createObjectRevisionStore } from './object-revision-store'
import { migrationRevisionFiles, readMigrationPlan, type MigrationPlan, type MigrationRevisionFile } from './migration-plan'
import { bindMigrationPlanInventory } from './migration-plan-inventory'
import { verifyMigrationPlanFiles } from './migration-plan-physical'
import { readMediaRevision } from './revision-store'
import { digest, type Manifest } from './revision-manifest'
import type { createMigrationCopyJournal } from './migration-copy-journal'

type Input = { serializedPlan: string; serializedInventory: string; expectedInventoryHash: string;
  sourceRoot: string; destination: Pick<ReturnType<typeof createObjectRevisionStore>, 'restore' | 'read'>;
  journal: Awaited<ReturnType<typeof createMigrationCopyJournal>> }

export class MigrationRevisionCopyError extends Error {
  constructor(readonly code: 'preflight-failed' | 'copy-failed', readonly attemptedRevisions: string[]) {
    super(`Migration revision copy failed: ${code}. Retain attempted destinations for reconciliation.`)
    this.name = 'MigrationRevisionCopyError'
  }
}

/** Internal preparatory transfer, NOT a cutover executor or public API.
 * Caller owns a frozen, trusted inventory and independently authenticated staged
 * revisions, plus an approved private destination. Hash agreement cannot prove
 * historical provenance. No DB or snapshot references are rewritten here.
 * Source must stay quiescent. Failed/uncertain writes are retained, never deleted
 * or automatically retried. Persist the receipt/error in the operator's journal.
 */
export async function copyMigrationRevisions(input: Input) {
  const { serializedPlan, serializedInventory, expectedInventoryHash, sourceRoot, destination, journal } = input
  let plan: MigrationPlan
  try {
    plan = readMigrationPlan(serializedPlan)
    bindMigrationPlanInventory(serializedPlan, serializedInventory, expectedInventoryHash)
    if (journal.planDigest !== plan.digest || journal.inventoryHash !== expectedInventoryHash ||
      JSON.stringify([...journal.revisions].sort()) !== JSON.stringify([...new Set(plan.evidence.map(entry => entry.revision))].sort())) throw new Error('Journal context mismatch.')
    // Check the entire source before the first destination write. Re-read each
    // revision below so total library buffers are never retained in memory.
    await verifyMigrationPlanFiles(serializedPlan, sourceRoot)
  } catch { throw new MigrationRevisionCopyError('preflight-failed', []) }
  const groups = new Map<string, Map<string, MigrationRevisionFile>>()
  for (const entry of migrationRevisionFiles(plan)) {
    const files = groups.get(entry.revision) ?? new Map()
    files.set(entry.filename, entry)
    groups.set(entry.revision, files)
  }
  const revisions = [...groups.keys()]
  const attempted: string[] = []
  let fileCount = 0
  let totalBytes = 0
  try {
    for (const revision of revisions) {
      const files = await readMediaRevision(sourceRoot, revision)
      const expected = groups.get(revision)!
      if (files.length !== expected.size || files.some(file => {
        const entry = expected.get(file.name)
        return !entry || file.bytes.length !== entry.bytes || digest(file.bytes) !== entry.sha256
      })) throw new Error('Source changed after preflight.')
      const manifest: Manifest = { schema: 1, revision, files: files.map(file => ({
        name: file.name, size: file.bytes.length, sha256: digest(file.bytes),
      })) }
      await journal.attempt(revision)
      attempted.push(revision)
      if (await destination.restore(revision, manifest, files) !== revision) throw new Error('Destination identity differs.')
      const observed = await destination.read(revision)
      if (observed.length !== files.length || observed.some((file, index) =>
        file.name !== files[index].name || !file.bytes.equals(files[index].bytes))) throw new Error('Destination bytes differ.')
      await journal.verified(revision)
      fileCount += files.length
      totalBytes += files.reduce((sum, file) => sum + file.bytes.length, 0)
    }
  } catch { throw new MigrationRevisionCopyError('copy-failed', [...attempted]) }
  return { schemaVersion: 1 as const, status: 'copied-and-verified' as const, canApply: false as const,
    journalId: journal.id, planDigest: plan.digest, inventoryHash: expectedInventoryHash, revisions, fileCount, totalBytes }
}
