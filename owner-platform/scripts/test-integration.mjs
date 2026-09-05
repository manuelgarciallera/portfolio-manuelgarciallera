import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const prefix = path.join(tmpdir(), 'owner-editorial-qa-')
const directory = await mkdtemp(prefix)
try {
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.integration.config.ts', ...process.argv.slice(2)], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, OWNER_INTEGRATION_DIRECTORY: directory },
    })
    child.once('error', reject)
    child.once('close', (code) => resolve(code ?? 1))
  })
} finally {
  // libSQL native transaction connections can retain Windows file handles until
  // the worker exits. Cleanup belongs to the parent, after the test process ends.
  if (!path.resolve(directory).startsWith(path.resolve(prefix))) throw new Error('Unsafe QA cleanup path')
  await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
}
