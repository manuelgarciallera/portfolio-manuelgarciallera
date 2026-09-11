import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { prepareEditorAssets } from '../scripts/prepare-editor-assets.mjs'

test('editor assets include the installed loader, workers and license without a CDN', async () => {
  const destination = await mkdtemp(path.join(os.tmpdir(), 'owner-editor-assets-'))
  try {
    const result = await prepareEditorAssets(destination)
    const metadata = JSON.parse(await readFile(new URL('../node_modules/monaco-editor/package.json', import.meta.url), 'utf8'))
    assert.equal(result, `/vendor/monaco/${metadata.version}/vs`)
    for (const file of ['loader.js', 'editor/editor.main.js']) {
      assert.deepEqual(await readFile(path.join(destination, result, file)),
        await readFile(new URL(`../node_modules/monaco-editor/min/vs/${file}`, import.meta.url)))
    }
    assert.match(await readFile(path.join(destination, `vendor/monaco/${metadata.version}/LICENSE`), 'utf8'), /MIT/)
    assert.deepEqual(await readFile(path.join(destination, `vendor/monaco/${metadata.version}/ThirdPartyNotices.txt`)),
      await readFile(new URL('../node_modules/monaco-editor/ThirdPartyNotices.txt', import.meta.url)))
    const workers = (await readdir(new URL('../node_modules/monaco-editor/min/vs/assets/', import.meta.url))).filter(name => /worker.*\.js$/.test(name))
    assert.ok(workers.some(name => name.startsWith('json.worker')))
    for (const worker of workers) {
      assert.deepEqual(await readFile(path.join(destination, result, 'assets', worker)),
        await readFile(new URL(`../node_modules/monaco-editor/min/vs/assets/${worker}`, import.meta.url)))
    }
    await prepareEditorAssets(destination)
    assert.ok((await readFile(path.join(destination, result, 'loader.js'))).length > 1000)
  } finally {
    await rm(destination, { recursive: true, force: true })
  }
})
