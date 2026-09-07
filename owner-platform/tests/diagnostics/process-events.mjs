// Opt-in diagnostic preload only. Never import from application code.
import childProcess from 'node:child_process'
import { writeSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'

function emit(event, fields = {}) {
  try {
    writeSync(2, `[owner-process] ${JSON.stringify({ pid: process.pid, event, ...fields })}\n`)
  } catch {
    // Diagnostics must not change process outcomes when stderr is unavailable.
  }
}

process.on('beforeExit', (code) => emit('beforeExit', { code }))
process.on('exit', (code) => emit('exit', { code }))
process.on('uncaughtExceptionMonitor', () => emit('uncaughtException'))

const fork = childProcess.fork
childProcess.fork = function (...args) {
  const child = Reflect.apply(fork, this, args)
  child.once('exit', (code, signal) => emit('childExit', { childPid: child.pid, code, signal }))
  return child
}
syncBuiltinESMExports()
