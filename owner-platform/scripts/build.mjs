import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { prepareEditorAssets } from './prepare-editor-assets.mjs'
import { prepareLexicalField } from './lexical-field-patch.mjs'
import { buildEnvironment } from './build-environment.mjs'

await prepareLexicalField()
await prepareEditorAssets()

// Next maintains separate dev/build output. Preserve any active dev lock/cache.

const nextBin = new URL('../node_modules/next/dist/bin/next', import.meta.url)
const result = spawnSync(process.execPath, [fileURLToPath(nextBin), 'build'], {
  env: {
    ...buildEnvironment(process.env),
    OWNER_PLATFORM_BUILD_PHASE: '1',
  },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
