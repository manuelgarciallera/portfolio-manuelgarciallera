import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

// Build-output contract: importing source constants alone cannot prove that
// Next applied the root template to the actual route metadata.
const buildDir = process.env.PUBLIC_TITLE_BUILD_DIR
const routes = ['proyectos', 'sobre-mi', 'investigacion', 'proceso', 'blog',
  'proyectos/buy-sell-marketplace', 'proyectos/laliga-club-operations-hub',
  'proyectos/coordination-hub', 'proyectos/the-ux-union', 'proyectos/nude-project']

for (const route of ['proyectos', 'sobre-mi', 'investigacion', 'proceso', 'blog']) {
  test(`${route} retains the full identity when shared`, async () => {
    assert.ok(buildDir)
    const html = await readFile(path.join(buildDir, 'server/app', `${route}.html`), 'utf8')
    const title = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1]
    assert.ok(title?.includes('Manuel García-Llera Añón'), `Incomplete social identity: ${title}`)
  })
}

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
