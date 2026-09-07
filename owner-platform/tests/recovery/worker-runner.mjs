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
  let diagnostics = ''
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (bytes) => { diagnostics = (diagnostics + bytes.toString()).slice(-16_384) })
  activeWorkers += 1
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL') }, 120_000)
  child.once('error', (error) => { spawnError = error })
  child.on('message', (message) => {
    if (message?.ready && !inputSent) { inputSent = true; child.send(input) }
    else if (message?.progress) console.log(`[recovery] ${message.progress}`)
    else response = message
  })
  child.once('close', (code) => {
    clearTimeout(timer)
    activeWorkers -= 1
    if (timedOut) reject(new Error(`Recovery ${input.mode} worker timed out.`))
    else if (spawnError) reject(spawnError)
    else if (code !== 0 || !response?.ok) reject(new Error(redact(`${response?.error ?? `Recovery ${input.mode} worker exited with ${code ?? 1}.`}\n${diagnostics}`, secrets)))
    else resolve(response.result)
  })
})
