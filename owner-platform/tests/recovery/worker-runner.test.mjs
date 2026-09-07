import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { runWorker, workersClosed } from './worker-runner.mjs'

const roots = []
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

it('waits for the child close event even when a successful IPC result arrives earlier', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'owner-worker-test-'))
  roots.push(root)
  const worker = path.join(root, 'worker.mjs')
  await writeFile(worker, `process.send({ready:true}); process.once('message', () => { process.send({ok:true,result:'done'}); setTimeout(() => process.disconnect(), 250); });`)
  let resolved = false
  const result = runWorker(worker, { mode: 'seed' }).then((value) => { resolved = true; return value })
  expect(workersClosed()).toBe(false)
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(resolved).toBe(false)
  expect(await result).toBe('done')
  expect(workersClosed()).toBe(true)
})

it('does not accept a successful IPC result from a process that exits with failure', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'owner-worker-test-'))
  roots.push(root)
  const worker = path.join(root, 'worker.mjs')
  await writeFile(worker, `process.send({ready:true}); process.once('message', () => { process.send({ok:true,result:'done'}, () => { process.exitCode=2; process.disconnect(); }); });`)
  await expect(runWorker(worker, { mode: 'seed' })).rejects.toThrow(/exited with 2/)
  expect(workersClosed()).toBe(true)
})

const syntheticSecret = 'synthetic-prefix-synthetic-suffix'
it.each([
  ['complete', [['stderr', syntheticSecret]], false],
  ['split chunks', [['stderr', 'synthetic-prefix-'], ['stderr', 'synthetic-suffix']], false],
  ['truncated suffix boundary', [['stderr', syntheticSecret + 'x'.repeat(16_374)]], true],
  ['split chunks across capacity', [['stderr', 'synthetic-prefix-' + 'x'.repeat(16_384)], ['stderr', 'synthetic-suffix']], true],
  ['split stdout/stderr with interleaving', [['stdout', 'synthetic-prefix-'], ['stderr', 'other diagnostic'], ['stdout', 'synthetic-suffix']], true],
  ['secret split between stdout and stderr', [['stdout', 'synthetic-prefix-'], ['stderr', 'synthetic-suffix']], true],
])('does not leak synthetic credentials from %s diagnostics', async (_name, chunks, omitted) => {
  const root = await mkdtemp(path.join(tmpdir(), 'owner-worker-test-'))
  roots.push(root)
  const worker = path.join(root, 'worker.mjs')
  await writeFile(worker, `process.send({ready:true}); process.once('message', async () => {
    for (const [channel, text] of ${JSON.stringify(chunks)}) {
      await new Promise(resolve => process[channel].write(text, resolve));
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    process.exitCode=2; process.disconnect();
  });`)
  const error = await runWorker(worker, { mode: 'seed', credentials: { password: syntheticSecret } }).catch((error) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toContain('exited with 2')
  expect(error.message).not.toContain('synthetic-prefix-')
  expect(error.message).not.toContain('synthetic-suffix')
  expect(error.message).not.toContain('tic-suffix')
  expect(error.message).toMatch(omitted ? /diagnostics omitted/i : /\[redacted\]/)
  expect(error.message.length).toBeLessThan(16_384)
  expect(workersClosed()).toBe(true)
})
