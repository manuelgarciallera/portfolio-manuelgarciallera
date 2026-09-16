import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const base = process.env.CONSENT_TEST_URL || 'http://localhost:3015'
const browser = await chromium.launch()
try {
  await mkdir('.audit/analytics-consent-integrated', { recursive: true })
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    context.setDefaultTimeout(8000)
    context.setDefaultNavigationTimeout(30000)
    const page = await context.newPage(), trackerRequests = [], errors = []
    page.on('request', req => { if (/umami\.is|google-analytics\.com|googletagmanager\.com|\/api\/web-vitals/.test(req.url())) trackerRequests.push(req.url()) })
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base + '/privacidad', { waitUntil: 'domcontentloaded' })
    const accept = page.getByRole('button', { name: 'Aceptar analítica', exact: true })
    await accept.waitFor()
    assert.deepEqual(trackerRequests, [])
    await page.screenshot({ path: `.audit/analytics-consent-integrated/dark-${width}.png` })
    await page.getByRole('button', { name: 'Rechazar analítica', exact: true }).click()
    await page.reload({ waitUntil: 'domcontentloaded' })
    assert.equal(await accept.count(), 0)
    await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.tagName === 'H2')
    await page.getByText('Detalles y preferencias', { exact: true }).click()
    await page.getByRole('checkbox', { name: 'Google Analytics', exact: true }).check()
    await page.getByRole('button', { name: 'Guardar selección', exact: true }).click()
    assert.deepEqual(trackerRequests, [], 'local/preview must never load trackers, even after acceptance')
    await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    await page.evaluate(() => document.documentElement.dataset.theme = 'light')
    await page.screenshot({ path: `.audit/analytics-consent-integrated/light-${width}.png` })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' }).click()
    await page.getByRole('link', { name: 'Volver al portfolio', exact: false }).click()
    await page.waitForURL(base + '/', { waitUntil: 'domcontentloaded' })
    assert.deepEqual(trackerRequests, [])
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log('PASS integrated Next pages, four widths, both themes, persistence, focus, no tracking on local host')
} finally { await browser.close() }
