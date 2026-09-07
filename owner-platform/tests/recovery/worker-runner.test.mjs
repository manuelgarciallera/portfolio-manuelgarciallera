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
