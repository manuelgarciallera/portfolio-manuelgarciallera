import { build } from 'esbuild'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const real = process.argv.includes('--real-sdk')
const result = await build({ stdin: { contents: `
  import { createBrowserConsent } from './src/lib/analytics-consent/browser';
  import { attachConsentLifecycle } from './src/lib/analytics-consent/lifecycle';
  const controller = createBrowserConsent(['/', '/casos', '/privacidad']);
  attachConsentLifecycle(controller, window, document);
  controller.visit(location.pathname);
  window.controller = controller;
`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, minify: true, write: false })
const code = result.outputFiles[0].text
const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  context.setDefaultTimeout(5000)
  const page = await context.newPage(), requests = [], collected = [], errors = []
  page.on('pageerror', e => errors.push(e.message))
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url())
    if (url.hostname === 'manuelgarciallera.com') {
      await route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta charset="utf-8"><title>PRIVATE_TITLE</title><label>Mensaje<input id="draft"></label><script>${code}</script>` }); return
    }
    requests.push(req.url())
    if (url.pathname === '/gtag/js' || (url.hostname === 'cloud.umami.is' && url.pathname === '/script.js')) {
      if (real) { await route.continue(); return }
      const body = url.pathname === '/script.js' ? `window.umami={track: fn => { const payload = window.portfolioAnalyticsFilter('event', fn({website:'test',url:location.href})); if(payload) fetch('https://cloud.umami.is/api/send',{method:'POST',body:JSON.stringify(payload)}); }};` : ''
      await route.fulfill({ contentType: 'text/javascript', body }); return
    }
    // Collection is always intercepted, including real-SDK mode. No test visits reach providers.
    collected.push({ url: req.url(), body: req.postData() || '' })
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"cache":"synthetic-qa"}', headers: { 'access-control-allow-origin': '*' } })
  })
  await page.goto('https://manuelgarciallera.com/?email=PRIVATE_QUERY#PRIVATE_HASH')
  await page.waitForTimeout(350)
  assert.equal(requests.length, 0, 'no external request before consent')
  await page.evaluate(() => window.controller.choose({ google: false, umami: false }))
  assert.equal(requests.length, 0, 'no external request after reject')
  await page.evaluate(() => window.controller.choose({ google: false, umami: true }))
  await page.waitForFunction(() => document.querySelector('#portfolio-umami-consented')?.dataset.loaded === 'true')
  await page.waitForTimeout(400)
  assert.ok(collected.length >= 1, 'Umami page view arrives at intercepted collection boundary')
  assert.ok(!requests.some(u => u.includes('googletagmanager')), 'Umami-only excludes Google')
  const beforeRepeat = collected.length
  await page.evaluate(() => { window.controller.visit('/?private=not-sent'); window.controller.refresh() })
  await page.waitForTimeout(200)
  assert.equal(collected.length, beforeRepeat, 'query-only navigation is not another view')
  await page.evaluate(() => { history.pushState({}, '', '/casos?email=PRIVATE_ROUTE'); window.controller.visit('/casos') })
  await page.waitForTimeout(400)
  assert.ok(collected.length > beforeRepeat)
  await page.evaluate(() => window.controller.choose({ google: true, umami: false }))
  await page.waitForFunction(() => document.querySelector('#portfolio-ga4-consented')?.dataset.loaded === 'true')
  await page.waitForTimeout(real ? 2200 : 200)
  if (real) {
    assert.ok(collected.some(r => r.url.includes('google-analytics.com')), 'GA4 sends to intercepted boundary')
    assert.ok((await context.cookies()).some(c => c.name === 'mgl_ga'), 'real SDK created its own cookie before withdrawal')
    assert.equal(collected.filter(r => new URL(r.url).searchParams.get('en') === 'page_view').length, 1, 'one Google page view after accepting, no automatic duplicate')
  }
  const beforeUnknown = collected.length
  await page.evaluate(() => { history.pushState({}, '', '/private/PERSON_TOKEN'); window.controller.visit('/private/PERSON_TOKEN') })
  await page.waitForTimeout(500)
  assert.equal(collected.length, beforeUnknown, 'unknown route sends nothing')
  const serialized = decodeURIComponent(JSON.stringify(collected))
  assert.ok(!/PRIVATE_QUERY|PRIVATE_HASH|PRIVATE_ROUTE|PRIVATE_TITLE|PERSON_TOKEN/.test(serialized), 'no raw URL/title leakage')
  await page.locator('#draft').fill('Do not lose this draft')
  await page.evaluate(() => {
    document.cookie = 'unrelated_cookie=keep;path=/';
    window.controller.choose({ google: false, umami: false });
  })
  const stoppedAt = collected.length
  await page.evaluate(() => { window.controller.visit('/'); window.dispatchEvent(new Event('blur')) })
  await page.waitForTimeout(1200)
  assert.equal(collected.length, stoppedAt, 'withdrawal stops collection')
  assert.equal(await page.locator('#draft').inputValue(), 'Do not lose this draft')
  const cookies = await context.cookies()
  assert.ok(!cookies.some(c => c.name.startsWith('mgl_ga')), 'owned GA cookies removed')
  assert.ok(cookies.some(c => c.name === 'unrelated_cookie'), 'unrelated cookies preserved')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'PASS', realSdk: real, collectionIntercepted: true, scriptRequests: requests.filter(u => u.includes('/gtag/js') || u.endsWith('/script.js')).length, collectedRequests: collected.length }))
} finally { await browser.close() }
