import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

rmSync(new URL('../.next/dev/', import.meta.url), { force: true, recursive: true })

const nextBin = new URL('../node_modules/next/dist/bin/next', import.meta.url)
const result = spawnSync(process.execPath, [fileURLToPath(nextBin), 'build'], {
  env: {
    ...process.env,
    OWNER_PLATFORM_BUILD_PHASE: '1',
  },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
