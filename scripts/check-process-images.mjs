import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  await mkdir('tmp/process-images', { recursive: true })
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await page.goto(`${process.env.PROCESS_TEST_URL || 'http://127.0.0.1:3016'}/proceso`, { waitUntil: 'domcontentloaded' })
    const frames = page.locator('.rd-process-image')
    await frames.first().waitFor()
    assert.equal(await frames.count(), 6)
    for (let i = 0; i < 6; i++) {
      const frame = frames.nth(i)
      await frame.scrollIntoViewIfNeeded()
      await frame.locator('img').evaluate(img => img.decode())
      const geometry = await frame.evaluate(el => {
        const rect = el.getBoundingClientRect()
        return { width: rect.width, height: rect.height, column: el.parentElement.getBoundingClientRect().width, below: el.nextElementSibling.getBoundingClientRect().top >= rect.bottom }
      })
      assert.ok(Math.abs(geometry.height / geometry.width - 1.04) < .01)
      assert.ok(Math.abs(geometry.width - geometry.column) < 2)
      assert.ok(geometry.below)
    }
    await frames.first().scrollIntoViewIfNeeded()
    await page.screenshot({ path: `tmp/process-images/${width}.png` })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  }
  console.log('PASS: six decoded images; same 25:26 proportion, column width, before index, no overflow at390/768/1440.')
} finally {
  await browser.close()
}
