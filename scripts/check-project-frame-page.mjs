import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = process.env.FRAME_TEST_URL || 'http://127.0.0.1:3014'
const url = new URL(origin)
assert(['127.0.0.1', 'localhost', 'manuelgarciallera.com'].includes(url.hostname))
const browser = await chromium.launch()
console.log('Browser launched')
await mkdir('tmp/project-frame-check', { recursive: true })
try {
  for (const width of [390, 768, 1440]) {
    console.log(`Opening ${width}px`)
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/casos`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    console.log(`Loaded ${width}px`)
    assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0)
    const card = page.locator('.rd-case-visual--nude-project').first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForFunction(() => {
      const img = document.querySelector('.rd-nude-cover__photo img')
      return img?.complete && img.naturalWidth > 0
    }, undefined, { timeout: 15000 })
    assert.equal(await card.locator('.rd-preview-carousel').getAttribute('data-frame'), 'cover')
    await card.screenshot({ path: `tmp/project-frame-check/cover-${width}.png`, timeout: 15000 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await card.hover({ force: true })
    await page.waitForFunction(() => document.querySelector('.rd-case-visual--nude-project .rd-preview-carousel')?.getAttribute('data-frame') === 'slide')
    const next = card.getByRole('button', { name: 'Vista siguiente' })
    const previous = await card.locator('.rd-preview-slide[data-active="true"] img').getAttribute('src')
    await next.click()
    assert.notEqual(await card.locator('.rd-preview-slide[data-active="true"] img').getAttribute('src'), previous)
    const slide = card.locator('.rd-preview-slide[data-active="true"]')
    assert.notEqual(await slide.evaluate(el => getComputedStyle(el, '::after').animationName), 'none')
    // Freeze only the decorative pulse for a reproducible screenshot; a normal
    // locator screenshot waits for slide movement and would miss this short effect.
    await slide.evaluate(el => {
      for (const animation of el.getAnimations({ subtree: true })) {
        if (animation.animationName === 'rd-frame-accent-pulse') {
          animation.pause()
          animation.currentTime = 392
        }
      }
    })
    await card.screenshot({ path: `tmp/project-frame-check/pulse-${width}.png`, timeout: 15000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await slide.evaluate(el => getComputedStyle(el, '::after').animationName), 'none')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    assert.deepEqual(errors, [])
    console.log(`PASS real page ${width}px: cover, next, pulse, reduced motion, no document overflow or JS errors`)
    await page.close()
  }
} finally { await browser.close() }
