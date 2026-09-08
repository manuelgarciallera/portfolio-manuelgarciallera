import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

import { createPhysicalBackup, restoreVerifiedBackup, snapshotFiles } from '../tests/recovery/backup-manifest.mjs'
import { createPostgresCluster, databaseCommand, preflightTools, runCommand, safeEnvironment } from '../tests/recovery/postgres-runtime.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'
import { finalizeSqliteEvidence } from '../tests/migration/evidence-lifecycle.mjs'

const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
const cache = path.join(ownerRoot, 'node_modules', '.cache')
const sqlitePrefix = path.join(cache, 'owner-media-migration-')
const postgresEnabled = process.argv.includes('--postgres')
const injectFailureAfterBackup = process.argv.includes('--inject-failure-after-backup')
const isolatedEnvironment = safeEnvironment()
assert.equal(isolatedEnvironment.DATABASE_URL, '')
assert.equal(isolatedEnvironment.PAYLOAD_SECRET, '')

const applicationCommit = (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: ownerRoot })).stdout.trim()
const credentials = { email: `migration-${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') }
const payloadSecret = randomBytes(32).toString('hex')
let postgres
let root
let result
let failure

try {
  let sourcePostgres
  let tools
  if (postgresEnabled) {
    const preflight = await preflightTools(process.env.OWNER_POSTGRES_BIN)
    tools = preflight.tools
    postgres = await createPostgresCluster({ cache, kind: 'recovery', tools })
    root = postgres.root
    console.log('[media-migration] initialize isolated PostgreSQL 17 cluster')
    sourcePostgres = await postgres.initialize()
  } else {
    await mkdir(cache, { recursive: true })
    root = await mkdtemp(sqlitePrefix)
  }

  const workerPath = path.join(root, 'runtime', 'media-migration-worker.mjs')
  await build({
    absWorkingDir: ownerRoot,
    bundle: true,
    entryPoints: [path.join(ownerRoot, 'tests', 'migration', 'media-migration-worker.mjs')],
    format: 'esm',
    outfile: workerPath,
    packages: 'external',
    platform: 'node',
    target: 'node20',
  })

  const source = path.join(root, 'source')
  const backup = path.join(root, 'backup')
  const cloneDirectory = path.join(root, 'clone')
  const legacyReturn = path.join(root, 'legacy-return')
  const databaseDirectory = (directory) => path.join(directory, 'database')
  const mediaDirectory = (directory) => path.join(directory, 'media')
  const input = (mode, directory, postgresOptions, extra = {}) => ({
    mode,
    credentials,
    payloadSecret,
    databaseDirectory: databaseDirectory(directory),
    mediaDirectory: mediaDirectory(directory),
    ...(postgresOptions ? { postgres: postgresOptions } : {}),
    ...extra,
  })
  const assertNoPayloadSessions = async (database) => {
    if (!postgres) return
    assert.equal((await postgres.query(database,
      'SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid <> pg_backend_pid()',
    )).stdout.trim(), '0', 'Payload connection remained active.')
  }

  console.log(`[media-migration] seed legacy ${postgresEnabled ? 'PostgreSQL' : 'SQLite'} source`)
  const seeded = await runWorker(workerPath, input('legacy-seed', source, sourcePostgres), ownerRoot)
  assert(workersClosed(), 'Legacy writer must close before physical copy.')
  await assertNoPayloadSessions('owner_source')
  if (postgres) {
    await mkdir(databaseDirectory(source), { recursive: true })
    const archive = path.join(databaseDirectory(source), 'owner.dump')
    await postgres.command('pg_dump', databaseCommand('pg_dump', {
      port: sourcePostgres.port, database: 'owner_source', archive,
    }))
    assert.equal((await readFile(archive)).subarray(0, 5).toString(), 'PGDMP')
  }
  const sourceBefore = await snapshotFiles(source)
  const manifest = await createPhysicalBackup({ applicationCommit, backupDirectory: backup, sourceDirectory: source })
  const backupBefore = await snapshotFiles(backup)
  if (injectFailureAfterBackup) throw new Error('Injected media migration failure after the physical backup.')

  await restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: cloneDirectory })
  let clonePostgres
  if (postgres) {
    await postgres.createDatabase('owner_restored')
    clonePostgres = postgres.options('owner_restored')
    await postgres.command('pg_restore', databaseCommand('pg_restore', {
      port: sourcePostgres.port,
      database: 'owner_restored',
      archive: path.join(databaseDirectory(cloneDirectory), 'owner.dump'),
    }))
  }

  console.log('[media-migration] reopen the same physical clone as prepared, without binding')
  const migrated = await runWorker(workerPath, input('prepared-migrate', cloneDirectory, clonePostgres, { expected: seeded }), ownerRoot)
  assert(workersClosed(), 'Prepared migration writer must close before binding reopen.')
  await assertNoPayloadSessions('owner_restored')

  console.log('[media-migration] reopen migrated clone with the real binding')
  const versioned = await runWorker(workerPath, input('versioned-verify', cloneDirectory, clonePostgres, {
    expected: seeded,
    migrated,
  }), ownerRoot)
  assert(workersClosed(), 'Versioned writer must close before legacy restore.')
  await assertNoPayloadSessions('owner_restored')

  if (postgres) {
    await postgres.query('owner_source', 'DROP DATABASE owner_restored')
  }
  await restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: legacyReturn })
  if (postgres) {
    await postgres.createDatabase('owner_restored')
    clonePostgres = postgres.options('owner_restored')
    await postgres.command('pg_restore', databaseCommand('pg_restore', {
      port: sourcePostgres.port,
      database: 'owner_restored',
      archive: path.join(databaseDirectory(legacyReturn), 'owner.dump'),
    }))
  }
  const returned = await runWorker(workerPath, input('legacy-verify', legacyReturn, clonePostgres, { expected: seeded }), ownerRoot)
  assert(workersClosed(), 'Legacy return writer must close before immutable comparisons.')
  await assertNoPayloadSessions('owner_restored')
  let sourceReadOnly
  if (postgres) {
    sourceReadOnly = await runWorker(workerPath, input('legacy-source-readonly', source, sourcePostgres, { expected: seeded }), ownerRoot)
    assert(workersClosed(), 'Read-only source verifier must close before immutable comparisons.')
    await assertNoPayloadSessions('owner_source')
  }

  assert.deepEqual(await snapshotFiles(source), sourceBefore)
  assert.deepEqual(await snapshotFiles(backup), backupBefore)
  result = {
    migration: 'passed',
    engine: postgresEnabled ? 'postgres' : 'sqlite',
    applicationCommit,
    rowsVerified: returned.legacyRowsVerified,
    ...(sourceReadOnly ? { sourceRowsVerified: sourceReadOnly.sourceRowsVerified } : {}),
    originalAndDerivedFiles: seeded.fileCounts.A + seeded.fileCounts.B,
    downloadsVerified: versioned.downloadsVerified,
    backupFiles: manifest.files.length,
    preparedCloneReopened: true,
    sourceFilesUnchanged: true,
    backupFilesUnchanged: true,
    rollbackVerified: migrated.rollbackVerified,
    staleSessionRejectedBeforeWrite: migrated.staleSessionRejectedBeforeWrite,
    workersClosed: true,
    cleanup: 'pending verified shutdown',
  }
} catch (error) {
  failure = error
} finally {
  if (postgres) {
    try {
      const retainedRoot = await postgres.shutdown({ childrenClosed: workersClosed(), retainRoot: Boolean(failure) })
      if (failure) console.error(`Synthetic migration evidence retained at ${retainedRoot}`)
      else if (result) result.cleanup = 'exact cluster stopped and only this run root removed'
    } catch (cleanupError) {
      console.error(`Synthetic migration shutdown or cleanup proof failed: ${cleanupError.message}`)
      failure ??= cleanupError
    }
  } else if (root) {
    try {
      const finalized = await finalizeSqliteEvidence({ cache, childrenClosed: workersClosed(), failure, root })
      if (finalized.retained) console.error(`Synthetic migration evidence retained at ${finalized.root}`)
      else if (result) result.cleanup = 'worker closure observed and only exact SQLite run root removed'
    } catch (cleanupError) {
      console.error(`Synthetic migration shutdown or cleanup proof failed: ${cleanupError.message}`)
      failure ??= cleanupError
    }
  }
}

if (failure) throw failure
console.log(JSON.stringify(result, null, 2))
