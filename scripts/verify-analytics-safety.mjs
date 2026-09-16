import { build } from 'esbuild'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const result = await build({ stdin: { contents: `
  import { createBrowserConsent } from './src/lib/analytics-consent/browser';
  window.controller = createBrowserConsent(['/']);
  window.controller.visit('/');
`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, minify: true, write: false })
const code = result.outputFiles[0].text
const browser = await chromium.launch()
try {
  for (const mode of ['dnt', 'gpc', 'storage', 'preview', 'late-script', 'failed-script']) {
    const context = await browser.newContext(), requests = [], errors = []
    const page = await context.newPage()
    page.setDefaultTimeout(8000)
    page.on('pageerror', e => errors.push(e.message))
    await context.addInitScript(mode => {
      if (mode === 'dnt') Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' })
      if (mode === 'gpc') Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true })
      if (mode === 'storage') Object.defineProperty(window, 'localStorage', { get: () => { throw Error('blocked') } })
    }, mode)
    const host = mode === 'preview' ? 'preview.example' : 'manuelgarciallera.com'
    let release, scriptSeen
    const gate = new Promise(resolve => { release = resolve })
    const seen = new Promise(resolve => { scriptSeen = resolve })
    await context.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.hostname === host) {
        await route.fulfill({ contentType: 'text/html', body: `<script>${code}</script>` }); return
      }
      requests.push(url.href)
      if (url.pathname === '/gtag/js') {
        scriptSeen()
        if (mode === 'failed-script') await route.abort('failed')
        else { await gate; await route.fulfill({ contentType: 'text/javascript', body: '' }) }
      } else await route.abort('blockedbyclient')
    })
    await page.goto(`https://${host}/`)
    await page.evaluate(umami => window.controller.choose({ google: true, umami }), !mode.endsWith('script'))
    if (mode.endsWith('script')) {
      // Only exercise Google in these cases; don't permit a second provider request.
      await Promise.race([seen, new Promise((_, reject) => setTimeout(() => reject(Error('SDK never requested')), 8000))])
      if (mode === 'late-script') {
        await page.evaluate(() => window.controller.choose({ google: false, umami: false }))
        release()
        await page.waitForFunction(() => document.querySelector('#portfolio-ga4-consented')?.dataset.loaded === 'true')
        const commands = await page.evaluate(() => window.mglAnalyticsLayer.map(args => args[0]))
        assert.ok(!commands.includes('config') && !commands.includes('event'), 'no queued view after withdrawal during load')
      } else {
        await page.waitForFunction(() => window.controller.getSnapshot().error === 'provider')
        assert.equal(await page.evaluate(() => window.controller.choose({ google: false, umami: false })), true)
      }
    } else {
      await page.waitForTimeout(100)
      assert.deepEqual(requests, [], `${mode}: no SDK even if acceptance is requested`)
    }
    assert.deepEqual(errors, [], `${mode}: page remains usable`)
    release()
    await context.close()
  }
  console.log('PASS DNT, GPC, blocked storage, preview host, late withdrawal and failed SDK')
} finally { await browser.close() }
