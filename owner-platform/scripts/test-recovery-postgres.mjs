import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createPhysicalBackup, restoreVerifiedBackup, snapshotFiles, verifyPhysicalBackup } from '../tests/recovery/backup-manifest.mjs'
import { assertTaskRoot, cleanupTask, databaseCommand, databaseOptions, preflightTools, runCommand, safeEnvironment } from '../tests/recovery/postgres-runtime.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'

const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
const cache = path.join(ownerRoot, 'node_modules', '.cache')
// Resolve and execute every required tool before creating a cluster or any test data.
const { tools, versions } = await preflightTools(process.env.OWNER_POSTGRES_BIN)
await runCommand(process.execPath, [path.join(ownerRoot, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--config', 'vitest.recovery.config.ts'], { cwd: ownerRoot, timeout: 60_000 }).then(({ stdout }) => console.log(stdout))
await mkdir(cache, { recursive: true })
const root = await mkdtemp(path.join(cache, 'owner-postgres-recovery-'))
const cluster = path.join(root, 'cluster')
const passwordFile = path.join(root, 'init-password')
const password = randomBytes(32).toString('hex')
const env = { ...safeEnvironment(), PGPASSWORD: password, PGCONNECT_TIMEOUT: '10', PSQLRC: path.join(root, 'no-psqlrc') }
const command = (name, args, options) => runCommand(tools[name], args, { env, secrets: [password], ...options })
let startAttempted = false
let startConfirmed = false
let initAttempted = false
let initialized = false
let failure
let result

try {
  await assertTaskRoot(cache, root)
  const port = await new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const chosen = probe.address().port
      probe.close((error) => error ? reject(error) : resolve(chosen))
    })
  })
  await writeFile(passwordFile, `${password}\n`, { flag: 'wx', mode: 0o600 })
  console.log('[postgres-recovery] initialize isolated SCRAM cluster')
  initAttempted = true
  await command('initdb', ['--pgdata', cluster, '--username=owner_recovery', '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', '--pwfile', passwordFile, '--encoding=UTF8', '--locale=C'])
  initialized = true
  // A generated configuration file avoids shell/pg_ctl -o quoting entirely.
  await writeFile(path.join(cluster, 'postgresql.auto.conf'), `listen_addresses = '127.0.0.1'\nport = ${port}\npassword_encryption = 'scram-sha-256'\nunix_socket_directories = ''\n`, { flag: 'w' })
  startAttempted = true
  await command('pg_ctl', ['start', '-D', cluster, '-l', path.join(root, 'postgres.log'), '-w', '-t', '30'], { timeout: 45_000 })
  startConfirmed = true
  const native = (name, database, archive) => command(name, databaseCommand(name, { port, database, archive }))
  const query = (database, sql) => command('psql', ['-X', '--host=127.0.0.1', `--port=${port}`, '--username=owner_recovery', '--no-password', `--dbname=${database}`, '--set=ON_ERROR_STOP=1', '--tuples-only', '--no-align', '--command', sql])
  await native('createdb', 'owner_source')
  assert.equal((await query('owner_source', "SHOW listen_addresses")).stdout.trim(), '127.0.0.1')
  assert.equal((await query('owner_source', "SELECT count(*) FROM pg_authid WHERE rolname='owner_recovery' AND rolpassword LIKE 'SCRAM-SHA-256$%'")).stdout.trim(), '1')
  const assertNoPayloadSessions = async (database) => {
    assert.equal((await query(database, 'SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid <> pg_backend_pid()')).stdout.trim(), '0', 'Payload connection still active before backup/restore.')
  }

  const workerPath = path.join(root, 'runtime', 'payload-worker.mjs')
  await build({ absWorkingDir: ownerRoot, bundle: true, entryPoints: [path.join(ownerRoot, 'tests', 'recovery', 'payload-worker.mjs')], format: 'esm', outfile: workerPath, packages: 'external', platform: 'node', target: 'node20' })
  const sourceDirectory = path.join(root, 'source')
  const backupDirectory = path.join(root, 'backup')
  const restoreDirectory = path.join(root, 'restored')
  const credentials = { email: `recovery-${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') }
  const payloadSecret = randomBytes(32).toString('hex')
  const input = (mode, database, mediaDirectory, expected) => ({ mode, postgres: databaseOptions(port, database, password), credentials, payloadSecret, mediaDirectory, expected })
  const applicationCommit = (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: ownerRoot })).stdout.trim()
  const seeded = await runWorker(workerPath, input('seed', 'owner_source', path.join(sourceDirectory, 'media')), ownerRoot)
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

  await verifyPhysicalBackup(backupDirectory)
  await command('pg_restore', ['--list', path.join(backupDirectory, 'data', 'database', 'owner.dump')])
  // Neither a database nor a media destination exists until all integrity checks pass.
  await restoreVerifiedBackup({ backupDirectory, restoreDirectory })
  await native('createdb', 'owner_restored')
  console.log('[postgres-recovery] native pg_restore into fresh database')
  await native('pg_restore', 'owner_restored', path.join(restoreDirectory, 'database', 'owner.dump'))
  const restored = await runWorker(workerPath, input('restore', 'owner_restored', path.join(restoreDirectory, 'media'), seeded), ownerRoot)
  await assertNoPayloadSessions('owner_restored')
  // Logical comparison: custom-format archives from independent dumps are not deterministic.
  await runWorker(workerPath, input('verify', 'owner_source', path.join(sourceDirectory, 'media'), seeded), ownerRoot)
  await assertNoPayloadSessions('owner_source')
  assert.deepEqual(await snapshotFiles(path.join(sourceDirectory, 'media')), mediaBefore)
  assert.deepEqual(await snapshotFiles(backupDirectory), backupBefore)
  result = { recovery: 'passed', engine: 'postgres', versions, applicationCommit, backupFiles: manifest.files.length, archiveFormat: 'pg_dump custom', mediaFilesVerified: restored.restoredMediaFileCount, pageVersionsRestored: restored.restoredVersionCount, corruptAndMissingArchiveRejected: true, sourceLogicalStateUnchanged: true, sourceSessionsClosedBeforeDump: true, ambientCredentialsIgnored: true }
} catch (error) {
  failure = error
} finally {
  // An interrupted initdb can leave a bootstrap child: preserve the root unless
  // initdb completed, or a running postmaster was explicitly stopped below.
  let stopped = !startAttempted && (!initAttempted || initialized)
  try {
    if (startAttempted) {
      await assertTaskRoot(cache, root)
      const state = await command('pg_ctl', ['status', '-D', cluster], { acceptedCodes: [0, 3] })
      if (!startConfirmed && state.code === 3) throw new Error('Unconfirmed startup: cannot prove that no startup child remains.')
      if (state.code === 0) {
        const pidInfo = (await readFile(path.join(cluster, 'postmaster.pid'), 'utf8')).split(/\r?\n/)
        assert.equal(path.resolve(pidInfo[1]), path.resolve(cluster), 'Cluster PID file does not identify this exact data directory.')
        await command('pg_ctl', ['stop', '-D', cluster, '-m', 'fast', '-w', '-t', '30'], { timeout: 45_000 })
      }
      assert.equal((await command('pg_ctl', ['status', '-D', cluster], { acceptedCodes: [3] })).code, 3)
      await assert.rejects(stat(path.join(cluster, 'postmaster.pid')), { code: 'ENOENT' })
      stopped = true
    }
    await cleanupTask({ cache, root, stopped, workersClosed: workersClosed() })
    console.log('[postgres-recovery] exact cluster stopped; synthetic run root removed')
  } catch (cleanupError) {
    console.error(`Synthetic recovery data retained at ${root}: ${cleanupError.message}`)
    failure ??= cleanupError
  }
}
if (failure) throw failure
console.log(JSON.stringify({ ...result, cleanup: 'verified shutdown and removed only this run root' }, null, 2))
