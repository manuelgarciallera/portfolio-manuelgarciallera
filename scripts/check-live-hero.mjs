import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const browser = await chromium.launch()
try {
  await mkdir('tmp/live-release', { recursive: true })
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    await page.goto('https://manuelgarciallera.com', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.rd-hero-art').waitFor()
    const canvasReady = await page.locator('.rd-hero-art[data-ready="true"]').waitFor({ timeout: 45000 }).then(() => true, () => false)
    const bounds = await page.evaluate(() => {
      const copy = document.querySelector('.rd-hero-copy').getBoundingClientRect()
      const art = document.querySelector('.rd-hero-art').getBoundingClientRect()
      return { gap: art.left - copy.right, overflow: document.documentElement.scrollWidth - innerWidth }
    })
    assert.ok(bounds.overflow <= 1, `Page overflow at ${width}`)
    if (width >= 768) assert.ok(bounds.gap >= 0, `Hero overlap at ${width}`)
    await page.screenshot({ path: `tmp/live-release/hero-${width}.png` })
    console.log(JSON.stringify({ width, canvasReady, ...bounds }))
    await page.close()
  }
} finally { await browser.close() }
