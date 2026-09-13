import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { prepareEditorAssets } from './prepare-editor-assets.mjs'
import { prepareLexicalField } from './lexical-field-patch.mjs'

await prepareLexicalField()
await prepareEditorAssets()

mkdirSync(new URL('../.data/', import.meta.url), { recursive: true })

const nextBin = new URL('../node_modules/next/dist/bin/next', import.meta.url)
const result = spawnSync(process.execPath, [fileURLToPath(nextBin), 'dev', ...process.argv.slice(2)], {
  env: process.env,
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
