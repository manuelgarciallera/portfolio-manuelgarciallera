import { chromium } from 'playwright'
import assert from 'node:assert/strict'

// Explicit live smoke test: sends ONE consented page view to each provider.
// Run only after an authorized production release. No query data or fixtures.
assert.equal(process.env.CONSENT_LIVE_TEST, '1', 'Set CONSENT_LIVE_TEST=1 to authorize real collection')
const origin = 'https://manuelgarciallera.com'
const browser = await chromium.launch()
const result = []
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = [], requests = [], responses = []
    const analytical = url => /(^|\.)(google-analytics\.com|googletagmanager\.com|umami\.is)$/.test(new URL(url).hostname)
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (analytical(request.url())) requests.push(request.url()) })
    page.on('response', response => {
      const url = new URL(response.url())
      if (analytical(response.url())) responses.push({ host: url.hostname, path: url.pathname, status: response.status() })
    })
    const response = await page.goto(origin + '/privacidad', { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    await page.getByRole('button', { name: 'Aceptar analítica', exact: true }).waitFor()
    assert.equal(requests.length, 0, 'No analytics network requests before choosing')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    if (width === 390) {
      const google = page.waitForResponse(r => new URL(r.url()).hostname.endsWith('google-analytics.com') && r.url().includes('/g/collect'), { timeout: 30000 })
      const umami = page.waitForResponse(r => new URL(r.url()).hostname.endsWith('umami.is') && r.request().method() === 'POST', { timeout: 30000 })
      await page.getByRole('button', { name: 'Aceptar analítica', exact: true }).click()
      const received = await Promise.all([google, umami])
      for (const r of received) assert.ok(r.ok(), `Collector ${new URL(r.url()).hostname}: ${r.status()}`)
      await page.waitForTimeout(2000)
      await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Rechazar analítica', exact: true }).click()
    const stoppedAt = requests.length
    await page.getByRole('link', { name: 'Volver al portfolio', exact: false }).click()
    await page.waitForURL(origin + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    assert.equal(requests.length, stoppedAt, 'No new analytics requests after rejection/withdrawal')
    assert.ok(!(await context.cookies()).some(cookie => cookie.name.startsWith('mgl_ga')))
    assert.deepEqual(errors, [])
    result.push({ width, beforeConsentRequests: 0, afterWithdrawalRequests: requests.length - stoppedAt, responses, jsErrors: errors.length })
    await context.close()
  }
  console.log(JSON.stringify({ status: 'PASS', origin, results: result }, null, 2))
} finally { await browser.close() }
