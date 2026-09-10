import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' })
  await page.goto((process.env.AUDIT_URL || 'http://127.0.0.1:3028') + '/casos/buy-sell-marketplace')
  await page.locator('#historia-system').evaluate(element => element.scrollIntoView({ block: 'start' }))
  await page.locator('.rd-prelude-progress li.is-active a[href="#historia-system"]').waitFor({ timeout: 5000 })
  assert.equal(await page.locator('.rd-prelude-progress li.is-active').count(), 1)
  console.log('Prelude scroll progress passed')
} finally { await browser.close() }
