import { createHash } from 'node:crypto'
import { readMigrationPlan, type MigrationPlan } from './migration-plan'
import { readMediaRevision } from './revision-store'

export type MigrationFileObservation = {
  schemaVersion: 1
  status: 'observed-match'
  canApply: false
  planDigest: string
  sourceInventoryHash: string
  revisionCount: number
  fileCount: number
  totalBytes: number
}

type Failure = 'candidate-invalid' | 'candidate-blocked' | 'revision-unreadable' | 'candidate-file-mismatch'

export class MigrationFileObservationError extends Error {
  constructor(readonly code: Failure) {
    // No local paths, native filesystem messages or client-provided content.
    super(`Migration file observation failed: ${code}.`)
    this.name = 'MigrationFileObservationError'
  }
}

/** Server-side, read-only observation of a candidate against a caller-owned root.
 * Requires a quiescent clone; this does not acquire a lock or create a snapshot.
 * The receipt is NOT a durable proof, inventory-coverage check, historical
 * authentication or permission. Reverify after any writer/storage change.
 * No endpoint or executor consumes this receipt; canApply remains false.
 */
export async function verifyMigrationPlanFiles(serialized: string, root: string): Promise<MigrationFileObservation> {
  let plan: MigrationPlan
  try { plan = readMigrationPlan(serialized) }
  catch { throw new MigrationFileObservationError('candidate-invalid') }
  if (plan.status === 'blocked') throw new MigrationFileObservationError('candidate-blocked')

  const revisions = new Map<string, Map<string, MigrationPlan['evidence'][number]>>()
  for (const entry of plan.evidence) {
    const files = revisions.get(entry.revision) ?? new Map()
    // readMigrationPlan already rejects contradictory aliases in a revision.
    files.set(entry.filename, entry)
    revisions.set(entry.revision, files)
  }

  let fileCount = 0
  let totalBytes = 0
  // Sequential: retain at most one revision's buffers (64 MiB), not the whole
  // candidate's possible 1 GiB. The existing reader validates the manifest too.
  for (const [revision, expected] of revisions) {
    let observed: Awaited<ReturnType<typeof readMediaRevision>>
    try { observed = await readMediaRevision(root, revision) }
    catch { throw new MigrationFileObservationError('revision-unreadable') }
    if (observed.length !== expected.size) throw new MigrationFileObservationError('candidate-file-mismatch')
    for (const file of observed) {
      const entry = expected.get(file.name)
      if (!entry || file.bytes.length !== entry.bytes ||
        createHash('sha256').update(file.bytes).digest('hex') !== entry.sha256) {
        throw new MigrationFileObservationError('candidate-file-mismatch')
      }
      fileCount += 1
      totalBytes += file.bytes.length
    }
  }

  return { schemaVersion: 1, status: 'observed-match', canApply: false,
    planDigest: plan.digest, sourceInventoryHash: plan.sourceInventoryHash,
    revisionCount: revisions.size, fileCount, totalBytes }
}
