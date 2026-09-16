import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const base = process.env.CONSENT_TEST_URL || 'http://localhost:3025'
const browser = await chromium.launch()
try {
  for (const block of [false, true]) {
    const context = await browser.newContext()
    const page = await context.newPage(), chunks = [], errors = []
    page.setDefaultTimeout(8000)
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base + '/privacidad', { waitUntil: 'networkidle' })
    const reject = page.getByRole('button', { name: 'Rechazar analítica', exact: true })
    await reject.waitFor()
    await page.route('**/_next/static/chunks/*.js', async route => {
      chunks.push(route.request().url())
      if (block) await route.abort('failed')
      else await route.continue()
    })
    await page.getByText('Detalles y preferencias', { exact: true }).click()
    if (block) {
      await page.getByRole('alert').filter({ hasText: 'No se pudieron cargar las preferencias' }).waitFor()
      await reject.click()
      assert.equal(await page.getByRole('region', { name: 'Tu privacidad, tu elección' }).count(), 0)
    } else {
      await page.getByRole('checkbox', { name: 'Umami', exact: true }).waitFor()
      assert.ok(chunks.length > 0, 'details code loads only when opened, not in initial payload')
      await page.getByRole('checkbox', { name: 'Umami', exact: true }).check()
      await page.getByRole('button', { name: 'Guardar selección', exact: true }).click()
    }
    assert.deepEqual(errors, [], 'a failed optional chunk does not crash the card')
    await context.close()
  }
  console.log('PASS details deferred; failed chunk leaves reject functional')
} finally { await browser.close() }
