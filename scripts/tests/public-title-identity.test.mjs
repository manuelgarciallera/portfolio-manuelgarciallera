import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

// Build-output contract: importing source constants alone cannot prove that
// Next applied the root template to the actual route metadata.
const buildDir = process.env.PUBLIC_TITLE_BUILD_DIR
const routes = ['casos', 'sobre-mi', 'investigacion', 'proceso', 'articulos',
  'casos/buy-sell-marketplace', 'casos/laliga-club-operations-hub',
  'casos/coordination-hub', 'casos/the-ux-union', 'casos/nude-project']

test('requires an explicit public build artifact', () => {
  assert.ok(buildDir, 'Set PUBLIC_TITLE_BUILD_DIR to a completed public build')
})

for (const route of routes) {
  test(`${route} identifies the full owner name in its generated title`, async () => {
    assert.ok(buildDir)
    const html = await readFile(path.join(buildDir, 'server/app', `${route}.html`), 'utf8')
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1]
    assert.ok(title, 'Generated page must have a title')
    assert.ok(title.endsWith(' | Manuel García-Llera Añón'), `Incomplete identity: ${title}`)
  })
}
