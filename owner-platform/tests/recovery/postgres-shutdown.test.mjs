import { EventEmitter } from 'node:events'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({ execute: undefined }))
// Substitute only the slow native executable boundary. Lifecycle validation,
// PID files, subprocess result handling and directory cleanup remain real.
vi.mock('node:child_process', () => ({
  execFile(file, args, options, callback) {
    const child = new EventEmitter()
    child.exitCode = null
    child.signalCode = null
    Promise.resolve().then(() => native.execute(file, args, options)).then(
      ({ code = 0, stdout = '' } = {}) => {
        child.exitCode = code
        callback(code ? Object.assign(new Error('native failure'), { code }) : null, stdout, '')
        child.emit('close', code)
      },
      (error) => {
        child.exitCode = 1
        callback(Object.assign(error, { code: 1 }), '', error.message)
        child.emit('close', 1)
      },
    )
    return child
  },
}))

import { createPostgresCluster } from './postgres-runtime.mjs'

const roots = []
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

async function initializedFixture({ remainsRunning = false } = {}) {
  const cache = await mkdtemp(path.join(tmpdir(), 'owner-pg-shutdown-test-'))
  roots.push(cache)
  let running = false
  native.execute = async (file, args, options) => {
    const directory = args[args.indexOf('-D') + 1]
    if (file === 'initdb') { await mkdir(args[1]); return }
    if (file === 'createdb') return
    if (file === 'psql') return { stdout: args.at(-1).startsWith('SHOW') ? '127.0.0.1' : '1' }
    if (file !== 'pg_ctl') throw new Error('Unexpected executable')
    if (args[0] === 'start') {
      running = true
      await writeFile(path.join(directory, 'postmaster.pid'), `1234\n${directory}\n`)
      return
    }
    if (args[0] === 'status') return { code: running ? 0 : 3 }
    if (args[0] !== 'stop') throw new Error('Unexpected pg_ctl operation')
    // Observed durable checkpoint took 40 s. Model that threshold without
    // sleeping or weakening fsync. Too-short or unbounded waits must fail.
    const seconds = Number(args[args.indexOf('-t') + 1])
    if (!args.includes('-w') || seconds <= 40 || seconds > 60
      || options.timeout < seconds * 1000 + 15000 || options.timeout > 75000) {
      throw new Error('Durable checkpoint exceeds the bounded shutdown budget')
    }
    if (args[args.indexOf('-m') + 1] !== 'fast') throw new Error('Unsafe shutdown mode')
    if (!remainsRunning) {
      running = false
      await rm(path.join(directory, 'postmaster.pid'))
    }
  }
  const tools = Object.fromEntries(['initdb', 'createdb', 'psql', 'pg_ctl'].map(name => [name, name]))
  const fixture = await createPostgresCluster({ cache, kind: 'editorial', tools })
  await fixture.initialize()
  return fixture
}

it('allows a 40-second durable checkpoint before verifying shutdown and cleaning the exact fixture', async () => {
  const fixture = await initializedFixture()
  await fixture.shutdown({ childrenClosed: true })
  await expect(stat(fixture.root)).rejects.toMatchObject({ code: 'ENOENT' })
})

it('retains the fixture when pg_ctl stop returns but the server still reports running', async () => {
  const fixture = await initializedFixture({ remainsRunning: true })
  await expect(fixture.shutdown({ childrenClosed: true })).rejects.toThrow('pg_ctl failed (0)')
  expect(await readFile(path.join(fixture.cluster, 'postmaster.pid'), 'utf8')).toContain(fixture.cluster)
  expect((await stat(fixture.root)).isDirectory()).toBe(true)
})
