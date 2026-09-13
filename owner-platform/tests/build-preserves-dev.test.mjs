import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

for (const exitCode of [0, 7]) {
  test(`build preserves development output when compiler exits ${exitCode}`, async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'owner-build-preserves-dev-'))
    try {
      for (const directory of ['scripts', '.next/dev/cache', 'node_modules/next/dist/bin', 'node_modules/@payloadcms/richtext-lexical/dist/field', 'node_modules/@payloadcms/richtext-lexical/dist/exports/client']) {
        await mkdir(path.join(root, directory), { recursive: true })
      }
      await copyFile(new URL('../scripts/build.mjs', import.meta.url), path.join(root, 'scripts/build.mjs'))
      await copyFile(new URL('../scripts/lexical-field-patch.mjs', import.meta.url), path.join(root, 'scripts/lexical-field-patch.mjs'))
      for (const file of ['package.json', 'dist/field/Field.js', 'dist/exports/client/Field-J6MIUIWP.js']) {
        await copyFile(new URL(`../node_modules/@payloadcms/richtext-lexical/${file}`, import.meta.url), path.join(root, 'node_modules/@payloadcms/richtext-lexical', file))
      }
      await writeFile(path.join(root, '.next/dev/lock'), 'synthetic development lock')
      await writeFile(path.join(root, '.next/dev/cache/marker'), 'synthetic cached build')
      await writeFile(path.join(root, 'scripts/prepare-editor-assets.mjs'), `
        import { writeFile } from 'node:fs/promises';
        export async function prepareEditorAssets() { await writeFile('assets-prepared', 'yes'); }
      `)
      // Exercise the real wrapper; the compiler is a controlled external process.
      await writeFile(path.join(root, 'node_modules/next/dist/bin/next'), `
        const fs = require('node:fs');
        if (!fs.existsSync('assets-prepared')) process.exit(99);
        fs.writeFileSync('compiler-receipt.json', JSON.stringify({
          args: process.argv.slice(2), phase: process.env.OWNER_PLATFORM_BUILD_PHASE
        }));
        process.exit(${exitCode});
      `)
      const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
        cwd: root, encoding: 'utf8', timeout: 15_000,
        env: { ...process.env, OWNER_PLATFORM_BUILD_PHASE: 'not-a-build' },
      })
      assert.ifError(result.error)
      assert.equal(result.status, exitCode, result.stderr)
      assert.deepEqual(JSON.parse(await readFile(path.join(root, 'compiler-receipt.json'), 'utf8')),
        { args: ['build'], phase: '1' })
      assert.equal(await readFile(path.join(root, '.next/dev/lock'), 'utf8'), 'synthetic development lock')
      assert.equal(await readFile(path.join(root, '.next/dev/cache/marker'), 'utf8'), 'synthetic cached build')
    } finally {
      // mkdtemp's exact synthetic root, never the working application's output.
      await rm(root, { recursive: true, force: true })
    }
  })
}
