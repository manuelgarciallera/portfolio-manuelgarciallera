import { chromium } from 'playwright'
import assert from 'node:assert/strict'

// Actual production pages served locally under a virtual canonical origin.
// Only official SDK downloads may reach the network. Collection is intercepted.
const base = process.env.CONSENT_TEST_URL || 'http://localhost:3025'
const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage(), collection = [], scripts = [], errors = []
  let closing = false
  page.setDefaultTimeout(15000)
  page.on('pageerror', e => errors.push(e.message))
  await context.route('**/*', async route => {
    try {
    const req = route.request(), url = new URL(req.url())
    if (url.hostname === 'manuelgarciallera.com') {
      const response = await route.fetch({ url: base + url.pathname + url.search })
      await route.fulfill({ response }); return
    }
    if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js'
      || url.hostname === 'cloud.umami.is' && url.pathname === '/script.js') {
      scripts.push(url.href); await route.continue(); return
    }
    collection.push({ url: req.url(), body: req.postData() || '' })
    await route.fulfill({ contentType: 'application/json', body: '{"cache":"synthetic-qa"}',
      headers: { 'access-control-allow-origin': '*' } })
    } catch (error) { if (!closing) throw error }
  })
  await page.goto('https://manuelgarciallera.com/privacidad?email=PRIVATE_QUERY#PRIVATE_HASH', { waitUntil: 'networkidle' })
  const accept = page.getByRole('button', { name: 'Aceptar analítica', exact: true })
  await accept.waitFor()
  assert.deepEqual(scripts, [], 'no SDK before acceptance')
  assert.deepEqual(collection, [], 'no collection before acceptance')
  await accept.click()
  await page.waitForFunction(() => ['portfolio-ga4-consented', 'portfolio-umami-consented'].every(id => document.getElementById(id)?.dataset.loaded === 'true'))
  await page.waitForTimeout(2500)
  assert.equal(scripts.length, 2)
  assert.ok(collection.some(r => r.url.includes('google-analytics.com')), 'Google boundary received a request')
  assert.ok(collection.some(r => r.url.includes('umami.is')), 'Umami boundary received a request')
  assert.ok(!/PRIVATE_QUERY|PRIVATE_HASH/.test(decodeURIComponent(JSON.stringify(collection))))
  await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
  await page.getByRole('button', { name: 'Rechazar analítica', exact: true }).click()
  const stoppedAt = collection.length
  await page.getByRole('link', { name: 'Volver al portfolio', exact: false }).click()
  await page.waitForURL('https://manuelgarciallera.com/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  assert.equal(collection.length, stoppedAt, 'no collection after withdrawal and navigation')
  assert.ok(!(await context.cookies()).some(c => c.name.startsWith('mgl_ga')))
  assert.deepEqual(errors, [])
  closing = true
  await context.close()
  console.log('PASS actual Next UI + official GA4/Umami SDKs; opt-in, sanitized URLs, withdrawal, navigation; collection intercepted')
} finally { await browser.close() }
