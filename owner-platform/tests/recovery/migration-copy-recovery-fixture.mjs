import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createLocalReq } from 'payload'
import { inspectPayloadLegacyMedia } from '../../src/media/legacy-media-inventory-service.ts'
import { createMigrationPlan, readMigrationPlan, migrationRevisionFiles } from '../../src/media/migration-plan.ts'
import { bindMigrationPlanInventory } from '../../src/media/migration-plan-inventory.ts'
import { digest, validateManifest, validateRevision, MAX_MANIFEST_BYTES } from '../../src/media/revision-manifest.ts'
import { createMigrationCopyJournal, readMigrationCopyJournal } from '../../src/media/migration-copy-journal.ts'
import { copyMigrationRevisions } from '../../src/media/migration-revision-copy.ts'
import { reconcileMigrationCopy } from '../../src/media/migration-copy-reconciliation.ts'

const inventoryFor = async (fixture, owner) => inspectPayloadLegacyMedia({ payload: fixture.payload,
  req: await createLocalReq({ user: owner }, fixture.payload), root: fixture.staticDir })
const exportedManifest = async (mediaDirectory, revision) => {
  validateRevision(revision)
  const bytes = await readFile(path.join(mediaDirectory, revision, 'manifest.json'))
  assert(bytes.length <= MAX_MANIFEST_BYTES)
  return { bytes, manifest: validateManifest(JSON.parse(bytes.toString()), revision), evidenceHash: digest(bytes) }
}

// This helper handles only the native, immutable revisions created in this
// isolated test. It is not a legacy-history reconstruction or operator CLI.
export async function captureRecoveryMigrationCandidate(fixture, owner, mediaDirectory) {
  const inventory = await inventoryFor(fixture, owner)
  const manifests = new Map()
  const references = []
  const evidence = []
  const referencedFiles = new Set()
  for (const reference of inventory.references) {
    const revision = validateRevision(reference.storageRevision)
    assert.equal(reference.status, 'versioned-not-inspected')
    if (!manifests.has(revision)) manifests.set(revision, await exportedManifest(mediaDirectory, revision))
    const { manifest, evidenceHash } = manifests.get(revision)
    const identity = { kind: reference.kind, documentId: reference.documentId, referenceId: reference.referenceId }
    references.push({ ...identity, variants: reference.files.map(file => file.variant) })
    for (const file of reference.files) {
      const stored = manifest.files.find(item => item.name === file.filename)
      assert(stored, 'A logical reference must have its own archived file')
      evidence.push({ ...identity, variant: file.variant, filename: stored.name, bytes: stored.size,
        sha256: stored.sha256, revision, evidenceHash })
      referencedFiles.add(JSON.stringify([revision, stored.name]))
    }
  }
  const retainedFiles = []
  for (const [revision, { manifest, evidenceHash }] of manifests) {
    for (const file of manifest.files) if (!referencedFiles.has(JSON.stringify([revision, file.name]))) {
      retainedFiles.push({ revision, filename: file.name, bytes: file.size, sha256: file.sha256, evidenceHash })
    }
  }
  const plan = createMigrationPlan({ sourceInventoryHash: inventory.hash, references, evidence, retainedFiles })
  const serializedPlan = JSON.stringify(plan)
  const serializedInventory = JSON.stringify(inventory)
  bindMigrationPlanInventory(serializedPlan, serializedInventory, inventory.hash)
  assert.equal(retainedFiles.length, 3, 'Snapshot-only revision retains its three unreferenced derivatives')
  const directory = path.join(mediaDirectory, 'migration')
  await mkdir(directory)
  await writeFile(path.join(directory, 'plan.json'), serializedPlan, { flag: 'wx', mode: 0o600 })
  await writeFile(path.join(directory, 'inventory.json'), serializedInventory, { flag: 'wx', mode: 0o600 })
  return { planDigest: plan.digest, inventoryHash: inventory.hash, retainedFiles: retainedFiles.length }
}

export async function restoreRecoveryMigration(fixture, owner, store, input) {
  const directory = path.join(input.mediaDirectory, 'migration')
  const serializedPlan = await readFile(path.join(directory, 'plan.json'), 'utf8')
  const serializedInventory = await readFile(path.join(directory, 'inventory.json'), 'utf8')
  const plan = readMigrationPlan(serializedPlan)
  const pinned = input.expected.migrationCandidate
  assert.equal(plan.digest, pinned.planDigest, 'Plan matches the independent source-process receipt')
  bindMigrationPlanInventory(serializedPlan, serializedInventory, pinned.inventoryHash)
  assert.equal((await inventoryFor(fixture, owner)).hash, pinned.inventoryHash, 'Recovered database matches frozen source inventory')
  const expectedFiles = migrationRevisionFiles(plan)
  const revisions = [...new Set(expectedFiles.map(file => file.revision))]
  assert.deepEqual([...revisions].sort(), input.expected.revisions.map(revision => revision.id).sort())
  const operationRoot = input.operationDirectory
  assert(path.isAbsolute(operationRoot))
  const relative = path.relative(input.mediaDirectory, operationRoot)
  assert(relative === '..' || relative.startsWith(`..${path.sep}`), 'Operations must not modify the backed-up media directory')
  await mkdir(operationRoot, { recursive: true })
  const sourceRoot = path.join(operationRoot, 'staged')
  await mkdir(sourceRoot)
  for (const revision of revisions) {
    const exported = await exportedManifest(input.mediaDirectory, revision)
    const entries = expectedFiles.filter(file => file.revision === revision)
    assert(entries.every(file => file.evidenceHash === exported.evidenceHash), 'Original manifest bytes match independently pinned evidence')
    const target = path.join(sourceRoot, revision)
    await mkdir(target)
    for (const [index, file] of exported.manifest.files.entries()) {
      const bytes = await readFile(path.join(input.mediaDirectory, revision, `${index}.bin`))
      assert.equal(bytes.length, file.size)
      assert.equal(digest(bytes), file.sha256)
      await writeFile(path.join(target, file.name), bytes, { flag: 'wx', mode: 0o600 })
    }
    await writeFile(path.join(target, 'manifest.json'), exported.bytes, { flag: 'wx', mode: 0o600 })
  }
  const destinationId = `recovery-${input.mode}`
  const journal = await createMigrationCopyJournal(operationRoot, { planDigest: plan.digest,
    inventoryHash: pinned.inventoryHash, destinationId, revisions })
  try {
    const copied = await copyMigrationRevisions({ serializedPlan, serializedInventory,
      expectedInventoryHash: pinned.inventoryHash, sourceRoot, destination: store, journal })
    assert.equal(copied.fileCount, 12)
    assert.equal(copied.canApply, false)
    const reconciliation = await reconcileMigrationCopy({ journalRoot: operationRoot, journalId: journal.id,
      serializedPlan, serializedInventory, expectedInventoryHash: pinned.inventoryHash,
      expectedDestinationId: destinationId, destination: store })
    assert.equal(reconciliation.revisions.length, 3)
    assert(reconciliation.revisions.every(row => row.journalState === 'verified' && row.observation === 'matched'))
    const observedJournal = await readMigrationCopyJournal(operationRoot, journal.id)
    assert.equal(observedJournal.verified.length, 3)
    assert.equal(observedJournal.uncertain.length, 0)
    return { migrationCopyVerified: true, copiedFiles: copied.fileCount, retainedFiles: plan.retainedFiles.length,
      reconciledRevisions: reconciliation.revisions.length, canApply: false }
  } finally { await journal.close() }
}
