import { mkdtemp, stat, writeFile, rm } from 'node:fs/promises'
import { once } from 'node:events'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, it } from 'vitest'
import * as runtime from './postgres-runtime.mjs'

const roots = []
const fixture = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'owner-pg-test-'))
  roots.push(root)
  return root
}
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

it('drops inherited database, connector and Node injection options', () => {
  expect(typeof runtime.safeEnvironment).toBe('function')
  const env = runtime.safeEnvironment({ PATH: 'tools', Path: 'tools', SystemRoot: 'Windows', PGHOST: 'remote', PGSERVICEFILE: 'real', DATABASE_URL: 'real', PAYLOAD_DROP_DATABASE: 'true', OWNER_BOOTSTRAP_SECRET: 'real', SMTP_PASS: 'real', NODE_OPTIONS: '--require evil', FIGMA_PLAN: 'real' })
  expect(env.PGHOST).toBeUndefined()
  expect(env.PGSERVICEFILE).toBeUndefined()
  expect(env.PAYLOAD_DROP_DATABASE).toBeUndefined()
  expect(env.NODE_OPTIONS).toBeUndefined()
  expect(env.DATABASE_URL).toBe('')
  expect(env.SMTP_PASS).toBe('')
  expect(env.NODE_ENV).toBe('test')
})

it('fails tool preflight before creating any run data', async () => {
  expect(typeof runtime.preflightTools).toBe('function')
  const root = await fixture()
  await expect(runtime.preflightTools(root)).rejects.toThrow(/missing.*initdb/i)
  await expect(stat(path.join(root, 'cluster'))).rejects.toMatchObject({ code: 'ENOENT' })
  await expect(runtime.preflightTools('')).rejects.toThrow(/OWNER_POSTGRES_BIN/)
})

it('accepts only an exact child run root for lifecycle paths', async () => {
  expect(typeof runtime.assertTaskRoot).toBe('function')
  const cache = await fixture()
  const root = await mkdtemp(path.join(cache, 'owner-postgres-recovery-'))
  await expect(runtime.assertTaskRoot(cache, root)).resolves.toBe(root)
  for (const invalid of [cache, path.dirname(cache), path.join(cache, 'owner-postgres-recovery-other', 'nested'), path.join(cache, 'other')]) {
    await expect(runtime.assertTaskRoot(cache, invalid)).rejects.toThrow(/unsafe/i)
  }
})

it('selects only an isolated SQLite fixture or fixed loopback PostgreSQL editorial metadata', async () => {
  expect(typeof runtime.editorialDatabaseConfig).toBe('function')
  const cache = await fixture()
  const sqliteRoot = await mkdtemp(path.join(tmpdir(), 'owner-editorial-qa-'))
  roots.push(sqliteRoot)
  await expect(runtime.editorialDatabaseConfig({
    DATABASE_URL: 'postgresql://ambient-owner.invalid/real',
    OWNER_INTEGRATION_DIRECTORY: sqliteRoot,
  }, { cache })).resolves.toEqual({
    engine: 'sqlite',
    url: `file:${path.join(sqliteRoot, 'editorial.db').replaceAll('\\', '/')}`,
  })

  const postgresRoot = await mkdtemp(path.join(cache, 'owner-postgres-editorial-'))
  const postgres = {
    host: '127.0.0.1', port: 54321, database: 'owner_editorial', user: 'owner_editorial',
    password: 'a'.repeat(64), ssl: false, connectionTimeoutMillis: 10_000,
  }
  await expect(runtime.editorialDatabaseConfig({
    DATABASE_URL: 'postgresql://ambient-owner.invalid/real',
    OWNER_INTEGRATION_ENGINE: 'postgres',
    OWNER_INTEGRATION_DIRECTORY: postgresRoot,
    OWNER_INTEGRATION_POSTGRES: JSON.stringify(postgres),
  }, { cache })).resolves.toEqual({ engine: 'postgres', pool: postgres })

  for (const invalid of [
    { ...postgres, host: 'localhost' },
    { ...postgres, database: 'owner_source' },
    { ...postgres, user: 'owner_recovery' },
    { ...postgres, password: 'short' },
    { ...postgres, connectionString: 'postgresql://elsewhere.invalid/real' },
  ]) {
    await expect(runtime.editorialDatabaseConfig({
      OWNER_INTEGRATION_ENGINE: 'postgres',
      OWNER_INTEGRATION_DIRECTORY: postgresRoot,
      OWNER_INTEGRATION_POSTGRES: JSON.stringify(invalid),
    }, { cache })).rejects.toThrow(/editorial PostgreSQL/i)
  }
})

it('allocates and cleans only the exact shared lifecycle root for each fixed run kind', async () => {
  expect(typeof runtime.createPostgresCluster).toBe('function')
  const cache = await fixture()
  const editorial = await runtime.createPostgresCluster({ cache, kind: 'editorial', tools: {} })
  expect(path.dirname(editorial.root)).toBe(cache)
  expect(path.basename(editorial.root)).toMatch(/^owner-postgres-editorial-/)
  expect((await stat(editorial.root)).isDirectory()).toBe(true)
  await editorial.shutdown({ childrenClosed: true })
  await expect(stat(editorial.root)).rejects.toMatchObject({ code: 'ENOENT' })

  const recovery = await runtime.createPostgresCluster({ cache, kind: 'recovery', tools: {} })
  expect(path.basename(recovery.root)).toMatch(/^owner-postgres-recovery-/)
  await recovery.shutdown({ childrenClosed: true })
  await expect(runtime.createPostgresCluster({ cache, kind: 'unknown', tools: {} })).rejects.toThrow(/run kind/i)
})

it('does not delete synthetic files when shutdown is unproved', async () => {
  expect(typeof runtime.cleanupTask).toBe('function')
  const cache = await fixture()
  const root = await mkdtemp(path.join(cache, 'owner-postgres-recovery-'))
  await writeFile(path.join(root, 'password'), 'synthetic')
  await expect(runtime.cleanupTask({ cache, root, stopped: false, workersClosed: true })).rejects.toThrow(/retained/)
  expect((await stat(path.join(root, 'password'))).isFile()).toBe(true)
  await expect(runtime.cleanupTask({ cache, root, stopped: true, workersClosed: false })).rejects.toThrow(/retained/)
  await runtime.cleanupTask({ cache, root, stopped: true, workersClosed: true })
  await expect(stat(root)).rejects.toMatchObject({ code: 'ENOENT' })
})

it('bounds subprocesses and redacts their diagnostics', async () => {
  expect(typeof runtime.runCommand).toBe('function')
  await expect(runtime.runCommand(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeout: 40 })).rejects.toThrow(/timed out/)
  await expect(runtime.runCommand(process.execPath, ['-e', 'process.stderr.write("secret-value"); process.exit(2)'], { secrets: ['secret-value'] })).rejects.toThrow(/\[redacted\]/)
})

it('does not claim closure when execFile reports an error while the real child remains alive', async () => {
  let child
  let forceClose
  let closeObserved = false
  const secret = 'synthetic-prefix-synthetic-suffix'
  const error = await runtime.runCommand(process.execPath, ['-e', 'process.stderr.write("synthetic-prefix-"); setInterval(()=>{},1000)'], {
    timeout: 40,
    closeWaitTimeout: 60,
    secrets: [secret],
    onSpawn(spawned) {
      child = spawned
      const realKill = spawned.kill.bind(spawned)
      forceClose = () => realKill('SIGKILL')
      spawned.once('close', () => { closeObserved = true })
      spawned.kill = () => {
        const killError = new Error('synthetic kill refusal')
        killError.code = 'EPERM'
        queueMicrotask(() => spawned.emit('error', killError))
        return false
      }
    },
  }).catch((caught) => caught)
  try {
    expect(child).toBeDefined()
    expect(error).toBeInstanceOf(Error)
    expect(error.childClosed).toBe(false)
    expect(error.message).toMatch(/EPERM/)
    expect(error.message).toMatch(/close.*not observed/i)
    expect(error.message).toMatch(/diagnostics omitted/i)
    expect(error.message).not.toContain('synthetic-prefix-')
    expect(closeObserved).toBe(false)
    expect(child.exitCode).toBeNull()
  } finally {
    if (child && !closeObserved) {
      forceClose()
      await once(child, 'close')
    }
  }
})

it('constructs only fixed loopback database endpoints and explicit native commands', async () => {
  expect(typeof runtime.databaseOptions).toBe('function')
  expect(runtime.databaseOptions(54321, 'owner_source', 'synthetic')).toMatchObject({ host: '127.0.0.1', port: 54321, database: 'owner_source', user: 'owner_recovery', password: 'synthetic', ssl: false })
  expect(() => runtime.databaseOptions(54321, 'real_database', 'synthetic')).toThrow(/database/)
  expect(() => runtime.databaseOptions(0, 'owner_source', 'synthetic')).toThrow(/port/)
  expect(typeof runtime.databaseCommand).toBe('function')
  const args = runtime.databaseCommand('pg_restore', { port: 54321, database: 'owner_restored', archive: '/tmp/archive.dump' })
  expect(args).toEqual(['--host=127.0.0.1', '--port=54321', '--username=owner_recovery', '--no-password', '--dbname=owner_restored', '--exit-on-error', '--single-transaction', '/tmp/archive.dump'])
})

it('refuses a native restore directed at the source database', () => {
  expect(() => runtime.databaseCommand('pg_restore', { port: 54321, database: 'owner_source', archive: '/tmp/archive.dump' })).toThrow(/restore database/)
})

it('omits native output cut by maxBuffer without leaking a secret prefix', async () => {
  const secret = 'synthetic-native-secret'
  const script = `process.stderr.write('x'.repeat(2*1024*1024-10) + '${secret}');`
  const error = await runtime.runCommand(process.execPath, ['-e', script], { secrets: [secret] }).catch((error) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toContain('ERR_CHILD_PROCESS_STDIO_MAXBUFFER')
  expect(error.message).toMatch(/diagnostics omitted/i)
  expect(error.message).not.toContain('synthetic-')
  expect(error.message.length).toBeLessThan(300)
})

it('omits a partial native diagnostic on timeout', async () => {
  const secret = 'synthetic-native-secret'
  const script = `process.stderr.write('synthetic-native'); setInterval(()=>{},1000)`
  const error = await runtime.runCommand(process.execPath, ['-e', script], { secrets: [secret], timeout: 500 }).catch((error) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toMatch(/timed out/)
  expect(error.message).toMatch(/diagnostics omitted/i)
  expect(error.message).not.toContain('synthetic-native')
})
