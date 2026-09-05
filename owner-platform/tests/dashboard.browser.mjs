import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const bundle = await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['tests/dashboard.fixture.tsx'], bundle: true, write: false,
  outdir: 'unused-output', format: 'iife', jsx: 'automatic',
  alias: { 'next/link': fileURLToPath(new URL('./document-controls-context.fixture.tsx', import.meta.url)) },
})
const js = bundle.outputFiles.find((file) => file.path.endsWith('.js')).text
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text
const browser = await chromium.launch({ headless: true })
const failures = []
try {
  for (const width of [320, 390, 768, 1280]) for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    const searches = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.hostname !== 'owner-dashboard.invalid') return route.abort()
      if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>' })
      if (url.pathname === '/fixture.js') return route.fulfill({ contentType: 'text/javascript', body: js })
      if (url.pathname === '/fixture.css') return route.fulfill({ contentType: 'text/css', body: `*{box-sizing:border-box}html{font-size:12px}body{margin:16px;font-family:Arial,sans-serif;background:${theme === 'dark' ? '#111' : '#fff'};--theme-text:${theme === 'dark' ? '#eee' : '#111'};--theme-bg:${theme === 'dark' ? '#171717' : '#fff'};--theme-input-bg:var(--theme-bg);--theme-elevation-50:var(--theme-bg);--theme-elevation-0:var(--theme-bg);--theme-elevation-600:${theme === 'dark' ? '#aaa' : '#555'};--theme-elevation-700:var(--theme-text);--theme-success-500:#068550;color:var(--theme-text)}${css}` })
      if (url.pathname === '/api/owner/dashboard') return route.fulfill({ json: { overview: {} } })
      if (url.pathname === '/api/owner/search') {
        searches.push(url.searchParams.get('q'))
        return route.fulfill({ json: { search: { count: 1, results: [{ adminPath: '/admin/collections/pages/1', collection: 'pages', id: 1, label: `Página ${'responsive'.repeat(30)}`, status: 'draft', updatedAt: '2026-09-05T12:00:00Z' }] } } })
      }
      // Empty evidence is intentional: this fixture never approves/publishes.
      return route.fulfill({ status: 503, json: { error: 'No test evidence' } })
    })
    try {
      await page.goto('https://owner-dashboard.invalid/fixture')
      const actions = page.getByRole('navigation', { name: 'Crear contenido' }).getByRole('link')
      await actions.first().waitFor()
      assert.equal(await actions.count(), 6)
      const input = page.getByRole('searchbox', { name: 'Buscar contenido' })
      const button = page.getByRole('button', { name: 'Buscar', exact: true })
      for (const control of [...await actions.all(), input, button]) {
        const box = await control.boundingBox()
        assert.ok(box && box.x >= 0 && box.x + box.width <= width, 'Dashboard control must fit the viewport')
        if (width <= 768) assert.ok(box.height >= 44, `Touch target must be >=44px, got ${box.height}px`)
        else assert.ok(box.height < 44, 'Keep the existing compact desktop scale')
      }
      await input.focus()
      await page.keyboard.press('Tab')
      assert.equal(await button.evaluate((element) => element === document.activeElement), true, 'Search must follow the input in keyboard order')
      assert.equal(await button.evaluate((element) => getComputedStyle(element).outlineStyle), 'solid')
      await input.fill('responsive')
      await input.press('Enter')
      await page.getByRole('link', { name: /Página responsive/ }).waitFor()
      assert.deepEqual(searches, ['responsive'])
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Long content names must not overflow')
      assert.deepEqual(errors, [])
      console.log(`PASS dashboard ${width}px ${theme}`)
    } catch (error) { failures.push(`${width}px ${theme}: ${error.message}`) }
    finally { await page.close() }
  }
} finally { await browser.close() }
assert.deepEqual(failures, [], 'Responsive dashboard regressions')
