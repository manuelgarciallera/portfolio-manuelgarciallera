import type { createObjectRevisionStore } from './object-revision-store'
import { readMigrationCopyJournal } from './migration-copy-journal'
import { readMigrationPlan, type MigrationPlan } from './migration-plan'
import { bindMigrationPlanInventory } from './migration-plan-inventory'
import { digest } from './revision-manifest'
type Input = { journalRoot: string; journalId: string; serializedPlan: string; serializedInventory: string;
  expectedInventoryHash: string; expectedDestinationId: string; destination: Pick<ReturnType<typeof createObjectRevisionStore>, 'read'> }
const fail = () => new Error('Migration reconciliation context is invalid or changed; no retry or cutover authorized.')

/** Read-only point-in-time observations. Caller must bind the logical destination
 * to an approved provider and freeze writers; no endpoint/credentials inferred.
 * An unreadable revision may be absent, corrupt, partial or unavailable. Never
 * treat that ambiguity, or a matched observation, as permission to overwrite.
 */
export async function reconcileMigrationCopy(input: Input) {
  let plan: MigrationPlan
  let journal: Awaited<ReturnType<typeof readMigrationCopyJournal>>
  try {
    plan = readMigrationPlan(input.serializedPlan)
    bindMigrationPlanInventory(input.serializedPlan, input.serializedInventory, input.expectedInventoryHash)
    journal = await readMigrationCopyJournal(input.journalRoot, input.journalId)
    if (journal.planDigest !== plan.digest || journal.inventoryHash !== input.expectedInventoryHash ||
      journal.destinationId !== input.expectedDestinationId ||
      JSON.stringify([...journal.revisions].sort()) !== JSON.stringify([...new Set(plan.evidence.map(entry => entry.revision))].sort())) throw fail()
  } catch { throw fail() }
  const groups = new Map<string, Map<string, MigrationPlan['evidence'][number]>>()
  for (const entry of plan.evidence) {
    const files = groups.get(entry.revision) ?? new Map()
    files.set(entry.filename, entry)
    groups.set(entry.revision, files)
  }
  const verified = new Set(journal.verified)
  const uncertain = new Set(journal.uncertain)
  const revisions: { revision: string; journalState: 'verified' | 'uncertain' | 'pending'; observation: 'matched' | 'mismatch' | 'unreadable' }[] = []
  for (const [revision, expected] of groups) {
    let observation: 'matched' | 'mismatch' | 'unreadable'
    try {
      const files = await input.destination.read(revision)
      const matches = files.length === expected.size && new Set(files.map(file => file.name)).size === files.length && files.every(file => {
        const entry = expected.get(file.name)
        return entry && file.bytes.length === entry.bytes && digest(file.bytes) === entry.sha256
      })
      observation = matches ? 'matched' : 'mismatch'
    } catch { observation = 'unreadable' }
    revisions.push({ revision, journalState: verified.has(revision) ? 'verified' : uncertain.has(revision) ? 'uncertain' : 'pending', observation })
  }
  try {
    if (JSON.stringify(await readMigrationCopyJournal(input.journalRoot, input.journalId)) !== JSON.stringify(journal)) throw fail()
  } catch { throw fail() }
  return { schemaVersion: 1 as const, canApply: false as const, journalId: journal.id,
    planDigest: plan.digest, inventoryHash: journal.inventoryHash, destinationId: journal.destinationId, revisions }
}
