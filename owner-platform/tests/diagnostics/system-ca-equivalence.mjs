// Diagnostic only: reports trust-set digests, never certificate contents.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { Worker, parentPort, isMainThread } from 'node:worker_threads'
import { createHash } from 'node:crypto'
import { getCACertificates } from 'node:tls'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)

function certificateSet() {
  const certificates = [...new Set(getCACertificates('default'))].sort()
  return { count: certificates.length, digest: createHash('sha256').update(JSON.stringify(certificates)).digest('hex') }
}
if (!isMainThread) {
  parentPort.postMessage(certificateSet())
} else if (process.argv[2] === 'baseline') {
  console.log(JSON.stringify(certificateSet()))
} else if (process.argv[2] === 'candidate') {
  const worker = new Worker(filename, { execArgv: [], env: { ...process.env } })
  worker.on('message', result => {
    assert.deepEqual(result, certificateSet(), 'Worker default trust must match parent')
    console.log(JSON.stringify(result))
  })
  worker.on('error', error => { console.error(error.code || 'worker failure'); process.exitCode = 1 })
  worker.on('exit', code => { if (code) process.exitCode = code })
} else {
  assert.equal(process.env.NODE_OPTIONS?.trim(), '--use-system-ca', 'Probe requires exact known flag; do not discard other options')
  const run = (mode, env) => {
    const result = spawnSync(process.execPath, [filename, mode], { env, encoding: 'utf8', timeout: 20000 })
    assert.equal(result.status, 0, `${mode} must exit normally: ${result.stderr}`)
    return JSON.parse(result.stdout)
  }
  const baseline = run('baseline', { ...process.env })
  const candidate = run('candidate', { ...process.env, NODE_OPTIONS: '', NODE_USE_SYSTEM_CA: '1' })
  assert.deepEqual(candidate, baseline, 'Equivalent setting must preserve the entire default trust set')
  console.log(JSON.stringify({ baseline, candidate, workerSucceeded: true, defaultTrustUnchanged: true }))
}
