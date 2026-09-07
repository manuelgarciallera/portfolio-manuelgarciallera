import { mkdtemp, stat, writeFile, rm } from 'node:fs/promises'
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
