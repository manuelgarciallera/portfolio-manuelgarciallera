import { fork } from 'node:child_process'
import { safeEnvironment, redact } from './postgres-runtime.mjs'

let activeWorkers = 0
export const workersClosed = () => activeWorkers === 0
export const runWorker = (workerPath, input, cwd) => new Promise((resolve, reject) => {
  let response
  let spawnError
  let timedOut = false
  let inputSent = false
  const child = fork(workerPath, [], { cwd, env: safeEnvironment(), stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
  const secrets = [input.credentials?.password, input.payloadSecret, input.postgres?.password]
  let diagnosticChunks = []
  let diagnosticBytes = 0
  let diagnosticChannel
  let diagnosticsOmitted = false
  for (const [channel, stream] of [['stdout', child.stdout], ['stderr', child.stderr]]) stream.on('data', (bytes) => {
    if (diagnosticsOmitted) return
    // Never retain a truncated prefix/suffix or guess ordering across channels:
    // either case can turn a complete secret into an unredactable fragment.
    if ((diagnosticChannel && diagnosticChannel !== channel) || diagnosticBytes + bytes.length > 16_384) {
      diagnosticsOmitted = true
      diagnosticChunks = []
      return
    }
    diagnosticChannel = channel
    diagnosticBytes += bytes.length
    diagnosticChunks.push(bytes)
  })
  activeWorkers += 1
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL') }, 120_000)
  child.once('error', (error) => { spawnError = error })
  child.on('message', (message) => {
    if (message?.ready && !inputSent) { inputSent = true; child.send(input) }
    else if (message?.progress) console.log(`[recovery] ${redact(message.progress, secrets)}`)
    else response = message
  })
  child.once('close', (code) => {
    clearTimeout(timer)
    activeWorkers -= 1
    const diagnostics = diagnosticsOmitted
      ? '[Raw diagnostics omitted: output exceeded 16384 bytes or used multiple streams.]'
      : Buffer.concat(diagnosticChunks).toString('utf8')
    if (timedOut) reject(new Error(`Recovery ${input.mode} worker timed out.`))
    else if (spawnError) reject(spawnError)
    else if (code !== 0 || !response?.ok) reject(new Error(redact(`Recovery ${input.mode} worker exited with ${code ?? 1}. ${response?.error ?? ''}\n${diagnostics}`, secrets)))
    else resolve(response.result)
  })
})
