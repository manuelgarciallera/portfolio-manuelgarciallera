import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch()
const base = process.argv[2] || 'http://localhost:3040'
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => scrollTo({ top: 600, behavior: 'instant' }))
  await page.waitForTimeout(150)
  await page.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }))
  await page.waitForTimeout(400)
  await page.locator('.rd-brand').click()
  await page.waitForTimeout(800)
  assert.equal(await page.evaluate(() => scrollY), 0, 'brand returns to top on the same home route')
  await page.goto(`${base}/sobre-mi`, { waitUntil: 'networkidle' })
  await page.locator('.rd-brand').click()
  await page.waitForURL(`${base}/`)
  assert.equal(await page.evaluate(() => scrollY), 0, 'brand returns home from an inner page')
  console.log('PASS brand: same-route return to top and inner-page return home')
} finally { await browser.close() }
