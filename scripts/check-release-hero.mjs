import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const browser = await chromium.launch()
try {
  await mkdir('tmp/release-hero', { recursive: true })
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(process.env.HERO_TEST_URL || 'http://127.0.0.1:3028', { waitUntil: 'domcontentloaded' })
    await page.locator('.rd-hero-art[data-ready="true"]').waitFor({ timeout: 60000 })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.rd-hero-art-fallback')).visibility === 'hidden')
    const result = await page.evaluate(() => {
      const art = document.querySelector('.rd-hero-art')
      const a = art.getBoundingClientRect()
      const c = document.querySelector('.rd-hero-copy').getBoundingClientRect()
      return { canvases: art.querySelectorAll('canvas').length, gap: a.left - c.right, overflow: document.documentElement.scrollWidth - innerWidth }
    })
    assert.equal(result.canvases, 1)
    assert.ok(result.overflow <= 1)
    if (width >= 768) assert.ok(result.gap >= 0)
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `tmp/release-hero/${width}.png` })
    console.log(JSON.stringify({ width, ...result }))
    await page.close()
  }
} finally { await browser.close() }
