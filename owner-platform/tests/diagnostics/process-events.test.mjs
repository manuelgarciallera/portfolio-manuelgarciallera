import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const preload = new URL('./process-events.mjs', import.meta.url).href
const run = (source) => spawnSync(process.execPath, ['--import', preload, '--input-type=module', '-e', source], {
  encoding: 'utf8', timeout: 10_000,
  env: { ...process.env, QA_SECRET: 'must-not-appear-in-diagnostics' },
})
const events = (result) => result.stderr.split('\n').filter((line) => line.startsWith('[owner-process] '))
  .map((line) => JSON.parse(line.slice('[owner-process] '.length)))

test('reports a normal exit without keeping the process alive or exposing environment', () => {
  const result = run('void 0')
  assert.equal(result.status, 0)
  assert.ok(events(result).some((event) => event.event === 'beforeExit' && event.code === 0))
  assert.ok(events(result).some((event) => event.event === 'exit' && event.code === 0))
  assert.ok(!result.stderr.includes('must-not-appear-in-diagnostics'))
})

test('preserves an explicit nonzero exit', () => {
  const result = run('process.exit(23)')
  assert.equal(result.status, 23)
  assert.ok(events(result).some((event) => event.event === 'exit' && event.code === 23))
})

test('observes an uncaught exception without suppressing its failure', () => {
  const result = run('throw new Error("synthetic-private-error")')
  assert.equal(result.status, 1)
  assert.ok(events(result).some((event) => event.event === 'uncaughtException'))
  assert.ok(!JSON.stringify(events(result)).includes('synthetic-private-error'))
})

test('preserves the exit outcome when stderr is closed', () => {
  const result = run('import { closeSync } from "node:fs"; closeSync(2); process.exit(23)')
  assert.equal(result.status, 23)
})

test('observes a real fork exit without exposing arguments', () => {
  const result = run(`
    import { fork } from 'node:child_process';
    const child = fork(new URL(${JSON.stringify(new URL('./exit-fixture.mjs', import.meta.url).href)}), ['private-argument'], { execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.on('close', (code) => { process.exitCode = code });
  `)
  assert.equal(result.status, 23)
  assert.ok(events(result).some((event) => event.event === 'childExit' && event.code === 23 && event.signal === null))
  assert.ok(!result.stderr.includes('private-argument'))
})

test('reports signal termination from a real fork', () => {
  const result = run(`
    import { fork } from 'node:child_process';
    const child = fork(new URL(${JSON.stringify(new URL('./exit-fixture.mjs', import.meta.url).href)}), ['wait-for-signal'], { execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.once('message', () => child.kill('SIGTERM'));
  `)
  assert.equal(result.status, 0)
  assert.ok(events(result).some((event) => event.event === 'childExit' && event.code === null && event.signal === 'SIGTERM'))
})
