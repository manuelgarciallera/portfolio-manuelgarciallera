import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Requires a separately started, fresh QA database and seed-workflow-qa.mjs.
const base = 'http://127.0.0.1:3013'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Synthetic QA credentials required')
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 })
    try {
      const login = await context.request.post(`${base}/api/users/login`, { data: { email, password } })
      assert.equal(login.status(), 200)
      const response = await context.request.get(`${base}/api/preview-snapshots?limit=1&sort=id`)
      assert.equal(response.status(), 200)
      const snapshot = (await response.json()).docs[0]
      assert(snapshot && snapshot.manifest.pageTitle, 'Seed a real snapshot first')
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}/admin/collections/preview-snapshots/${snapshot.id}`, { timeout: 60000 })
      const link = page.getByRole('link', { name: 'Ver captura histórica' })
      await link.waitFor({ state: 'visible', timeout: 60000 })
      const popupPromise = context.waitForEvent('page')
      await link.click()
      const historical = await popupPromise
      historical.on('pageerror', error => errors.push(error.message))
      await historical.getByRole('heading', { name: `Captura histórica: ${snapshot.manifest.pageTitle}`, exact: true }).waitFor({ timeout: 60000 })
      assert.equal(new URL(historical.url()).pathname, `/admin/snapshot-preview/${snapshot.id}`)
      await historical.getByText('Workflow QA', { exact: true }).waitFor()
      assert((await historical.locator('body').innerText()).includes('no es el borrador actual'))
      for (const name of ['Móvil', 'Tablet', 'Desktop']) {
        const button = historical.getByRole('button', { name, exact: true })
        await button.click()
        assert.equal(await button.getAttribute('aria-pressed'), 'true')
      }
      assert(await historical.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'No horizontal overflow')
      await historical.screenshot({ path: `node_modules/.cache/snapshot-view-${width}.png`, fullPage: true })
      await historical.getByRole('link', { name: 'Volver a la captura', exact: true }).click()
      await historical.waitForURL(`**/admin/collections/preview-snapshots/${snapshot.id}`)
      assert.deepEqual(errors, [], 'No runtime page errors')
      console.log(JSON.stringify({ width, historicalNavigation: true, viewportControls: true, returnLink: true, overflow: false }))
    } finally { await context.close() }
  }
  const anonymous = await browser.newContext()
  try {
    const page = await anonymous.newPage()
    await page.goto(`${base}/admin/snapshot-preview/1`)
    await page.waitForURL(url => url.pathname === '/admin/login', { timeout: 30000 })
    console.log(JSON.stringify({ anonymousRedirect: true }))
  } finally { await anonymous.close() }
} finally { await browser.close() }
