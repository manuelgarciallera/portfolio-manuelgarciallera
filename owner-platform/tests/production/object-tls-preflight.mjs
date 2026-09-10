import { mkdtemp } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { cleanupTask, runCommand, safeEnvironment } from '../recovery/postgres-runtime.mjs'

export const verifyObjectTLS = async ({ cwd, openssl }) => {
  const cache = path.join(cwd, 'node_modules/.cache')
  const root = await mkdtemp(path.join(cache, 'owner-tls-'))
  let fixture
  let childrenClosed = true
  let fixtureClosed = false
  try {
    const output = path.join(root, 'fixture.mjs')
    await build({ absWorkingDir: cwd, entryPoints: [path.join(cwd, 'tests/production/object-environment.mjs')],
      bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: output })
    fixture = await (await import(pathToFileURL(output).href)).startProductionObjectEnvironment({ root, openssl })
    const env = { ...safeEnvironment(), NODE_EXTRA_CA_CERTS: fixture.environment.NODE_EXTRA_CA_CERTS,
      TLS_TEST_URL: fixture.environment.OWNER_MEDIA_ENDPOINT }
    try {
      await runCommand(process.execPath, ['-e', `require('node:https').get(process.env.TLS_TEST_URL,r=>{r.resume();if(r.statusCode!==404)process.exitCode=1}).on('error',e=>{console.error(e.code);process.exitCode=1})`], { env, timeout: 10_000 })
    } catch (error) {
      childrenClosed = error.childClosed === true
      throw new Error('Synthetic object TLS preflight failed before build. Check local certificate interception; do not disable TLS verification.', { cause: error })
    }
  } catch (error) {
    if (error.childClosed === false) childrenClosed = false
    throw error
  } finally {
    try { await fixture?.close(); fixtureClosed = true } finally {
      await cleanupTask({ cache, root, stopped: fixtureClosed, workersClosed: childrenClosed, taskPrefix: 'owner-tls-' })
    }
  }
}
