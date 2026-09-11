import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createPhysicalBackup, restoreVerifiedBackup, snapshotFiles, verifyPhysicalBackup } from '../tests/recovery/backup-manifest.mjs'
import { createPostgresCluster, databaseCommand, preflightTools, runCommand } from '../tests/recovery/postgres-runtime.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'
import { assertVersionedDamageRejected, restoreVersionedBackup, verifyVersionedBackup } from '../tests/recovery/versioned-media-manifest.mjs'

const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
const cache = path.join(ownerRoot, 'node_modules', '.cache')
const versionedMedia = process.argv.includes('--versioned-media')
const objectMedia = process.argv.includes('--object-media')
const fullOwner = process.argv.includes('--full-owner')
if (fullOwner && !objectMedia) throw new Error('Full owner recovery requires object media mode.')
if (versionedMedia && objectMedia) throw new Error('Choose one media recovery mode.')
// Resolve and execute every required tool before creating a cluster or any test data.
const { tools, versions } = await preflightTools(process.env.OWNER_POSTGRES_BIN)
await runCommand(process.execPath, [path.join(ownerRoot, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--config', 'vitest.recovery.config.ts'], { cwd: ownerRoot, timeout: 60_000 }).then(({ stdout }) => console.log(stdout))
const postgres = await createPostgresCluster({ cache, kind: 'recovery', tools })
const { root } = postgres
let failure
let result

try {
  console.log('[postgres-recovery] initialize isolated SCRAM cluster')
  const sourcePostgres = await postgres.initialize()
  const native = (name, database, archive) => postgres.command(name, databaseCommand(name, { port: sourcePostgres.port, database, archive }))
  const query = postgres.query
  assert.equal((await query('owner_source', "SHOW listen_addresses")).stdout.trim(), '127.0.0.1')
  assert.equal((await query('owner_source', "SELECT count(*) FROM pg_authid WHERE rolname='owner_recovery' AND rolpassword LIKE 'SCRAM-SHA-256$%'")).stdout.trim(), '1')
  const assertNoPayloadSessions = async (database) => {
    assert.equal((await query(database, 'SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid <> pg_backend_pid()')).stdout.trim(), '0', 'Payload connection still active before backup/restore.')
  }

  const workerPath = path.join(root, 'runtime', 'payload-worker.mjs')
  await build({ absWorkingDir: ownerRoot, bundle: true, entryPoints: [path.join(ownerRoot, 'tests', 'recovery', objectMedia ? 'object-media-worker.mjs' : versionedMedia ? 'versioned-media-worker.mjs' : 'payload-worker.mjs')], format: 'esm', outfile: workerPath, packages: 'external', platform: 'node', target: 'node20' })
  const sourceDirectory = path.join(root, 'source')
  const backupDirectory = path.join(root, 'backup')
  const restoreDirectory = path.join(root, 'restored')
  const credentials = { email: `recovery-${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') }
  const payloadSecret = randomBytes(32).toString('hex')
  const input = (mode, database, mediaDirectory, expected) => ({ mode, postgres: postgres.options(database), credentials, payloadSecret, mediaDirectory, expected, fullOwner,
    operationDirectory: path.join(root, 'operations', mode) })
  const applicationCommit = (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: ownerRoot })).stdout.trim()
  const seeded = await runWorker(workerPath, input('seed', 'owner_source', path.join(sourceDirectory, 'media')), ownerRoot)
  if (fullOwner) assert(seeded.migrationCandidate?.inventoryHash && seeded.migrationCandidate?.planDigest, 'Full owner recovery needs an inventory-bound migration candidate, not a manual object replay')
  assert(workersClosed(), 'Seed process must close before pg_dump and media copy.')
  await assertNoPayloadSessions('owner_source')
  await mkdir(path.join(sourceDirectory, 'database'))
  const archive = path.join(sourceDirectory, 'database', 'owner.dump')
  console.log('[postgres-recovery] native pg_dump after Payload process close')
  await native('pg_dump', 'owner_source', archive)
  assert.equal((await readFile(archive)).subarray(0, 5).toString(), 'PGDMP')
  const manifest = await createPhysicalBackup({ applicationCommit, backupDirectory, sourceDirectory })
  const backupBefore = await snapshotFiles(backupDirectory)
  const mediaBefore = await snapshotFiles(path.join(sourceDirectory, 'media'))

  let damageCases
  if (versionedMedia) {
    damageCases = await assertVersionedDamageRejected({ backupDirectory, root, expected: seeded,
      assertDatabaseAbsent: async () => assert.equal((await query('owner_source', "SELECT count(*) FROM pg_database WHERE datname='owner_restored'")).stdout.trim(), '0'),
    })
  }
  if (objectMedia) {
    damageCases = 0
    const targetFiles = ['0.bin', '1.bin', 'manifest.json'].map(name => path.join(seeded.revisions[0].id, name))
    if (fullOwner) targetFiles.push(path.join('migration', 'plan.json'), path.join('migration', 'inventory.json'))
    for (const targetFile of targetFiles) {
      for (const damage of ['corrupt', 'missing']) {
        const invalid = path.join(root, `object-invalid-${damageCases++}`)
        const target = `${invalid}-restore`
        await cp(backupDirectory, invalid, { recursive: true, force: false, errorOnExist: true })
        const damaged = path.join(invalid, 'data', 'media', targetFile)
        if (damage === 'missing') await rm(damaged)
        else await writeFile(damaged, 'synthetic corruption')
        await assert.rejects(restoreVerifiedBackup({ backupDirectory: invalid, restoreDirectory: target }), /integrity/)
        await assert.rejects(stat(target), { code: 'ENOENT' })
        assert.equal((await query('owner_source', "SELECT count(*) FROM pg_database WHERE datname='owner_restored'")).stdout.trim(), '0')
      }
    }
  }

  // Exercise the actual dump artifact's corrupt/missing refusal before any restore output.
  for (const damage of ['corrupt', 'missing']) {
    const invalid = path.join(root, `backup-${damage}`)
    const target = path.join(root, `restore-${damage}`)
    await cp(backupDirectory, invalid, { recursive: true, force: false, errorOnExist: true })
    const invalidArchive = path.join(invalid, 'data', 'database', 'owner.dump')
    if (damage === 'missing') await rm(invalidArchive)
    else await writeFile(invalidArchive, 'corrupted archive')
    await assert.rejects(restoreVerifiedBackup({ backupDirectory: invalid, restoreDirectory: target }), /integrity/)
    await assert.rejects(stat(target), { code: 'ENOENT' })
    assert.equal((await query('owner_source', "SELECT count(*) FROM pg_database WHERE datname='owner_restored'")).stdout.trim(), '0')
  }

  await (versionedMedia ? verifyVersionedBackup : verifyPhysicalBackup)(backupDirectory)
  await postgres.command('pg_restore', ['--list', path.join(backupDirectory, 'data', 'database', 'owner.dump')])
  // Neither a database nor a media destination exists until all integrity checks pass.
  await (versionedMedia ? restoreVersionedBackup : restoreVerifiedBackup)({ backupDirectory, restoreDirectory })
  await postgres.createDatabase('owner_restored')
  console.log('[postgres-recovery] native pg_restore into fresh database')
  await native('pg_restore', 'owner_restored', path.join(restoreDirectory, 'database', 'owner.dump'))
  const restored = await runWorker(workerPath, input('restore', 'owner_restored', path.join(restoreDirectory, 'media'), seeded), ownerRoot)
  if (objectMedia) assert.notEqual(restored.pid, seeded.pid, 'Recovery uses a different process')
  if (fullOwner) assert.equal(restored.migrationCopyVerified, true, 'Restored files must traverse journaled copy and reconciliation')
  await assertNoPayloadSessions('owner_restored')
  // Logical comparison: custom-format archives from independent dumps are not deterministic.
  await runWorker(workerPath, input('verify', 'owner_source', path.join(sourceDirectory, 'media'), seeded), ownerRoot)
  await assertNoPayloadSessions('owner_source')
  assert.deepEqual(await snapshotFiles(path.join(sourceDirectory, 'media')), mediaBefore)
  assert.deepEqual(await snapshotFiles(backupDirectory), backupBefore)
  if (versionedMedia) await verifyVersionedBackup(backupDirectory)
  result = { recovery: 'passed', engine: 'postgres', versions, applicationCommit, backupFiles: manifest.files.length, archiveFormat: 'pg_dump custom', mediaFilesVerified: restored.restoredMediaFileCount,
    ...(versionedMedia ? { mediaVersionsRestored: restored.restoredVersionCount } : { pageVersionsRestored: restored.restoredVersionCount }),
    corruptAndMissingArchiveRejected: true, sourceLogicalStateUnchanged: true, sourceSessionsClosedBeforeDump: true, ambientCredentialsIgnored: true }
  if (versionedMedia) Object.assign(result, { mode: 'versioned-media', damageCasesRejectedBeforeAllocation: damageCases,
    revisionsRecovered: restored.revisionsRecovered, authenticatedHistoricalFiles: restored.authenticatedHistoricalFiles,
    scope: 'media and real frozen previews with minimal persisted page/brand inputs', backupReceiptsUnchanged: true })
  if (objectMedia) {
    delete result.pageVersionsRestored
    Object.assign(result, { mode: 'object-media', mediaFilesVerified: restored.recoveredFiles,
      revisionsRecovered: restored.recoveredRevisions, damageCasesRejectedBeforeAllocation: damageCases + 2,
      login: restored.login, history: restored.history, independentEdit: restored.independentEdit,
      frozenPreview: restored.frozenPreview,
      pageVersionsRestored: restored.pageVersionsRestored, editorialStateUnchanged: restored.editorialStateUnchanged,
      snapshotOnlyRetention: restored.snapshotOnlyRetention,
      scope: 'Media and real preview/audit with minimal page/brand fixtures; fresh synthetic S3 provider per child', backupReceiptsUnchanged: true })
  }
  if (fullOwner) Object.assign(result, { mode: 'full-owner-object-media',
    scope: 'Complete owner configuration installed from native migrations; synthetic page, brand, media, preview, draft snapshot, release and restore workflow',
    planExecuted: restored.planExecuted, pageEditedAfterRecovery: restored.pageEditedAfterRecovery,
    articleRecovered: restored.articleRecovered, articleVersionsRestored: restored.articleVersionsRestored,
    articleEditedAfterRecovery: restored.articleEditedAfterRecovery,
    migrationCopyVerified: restored.migrationCopyVerified, retainedFiles: restored.retainedFiles,
    reconciledRevisions: restored.reconciledRevisions })
} catch (error) {
  failure = error
} finally {
  try {
    await postgres.shutdown({ childrenClosed: workersClosed() })
    console.log('[postgres-recovery] exact cluster stopped; synthetic run root removed')
  } catch (cleanupError) {
    console.error(`Synthetic recovery data retained at ${root}: ${cleanupError.message}`)
    failure ??= cleanupError
  }
}
if (failure) throw failure
console.log(JSON.stringify({ ...result, cleanup: 'verified shutdown and removed only this run root' }, null, 2))
