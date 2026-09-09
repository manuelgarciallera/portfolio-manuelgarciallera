import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://127.0.0.1:3028'
const browser = await chromium.launch()
try {
  await mkdir('tmp/single-hero', { recursive: true })
  for (const width of [320, 390, 768, 1440]) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await page.locator('.rd-hero-art img').evaluate(img => img.decode())
      const result = await page.evaluate(() => {
        const art = document.querySelector('.rd-hero-art')
        const name = art.querySelector('.rd-hero-name')
        const heading = document.querySelector('.rd-hero h1')
        const rect = name.getBoundingClientRect()
        const parent = art.getBoundingClientRect()
        return {
          name: name.textContent, images: art.querySelectorAll('img').length,
          canvases: art.querySelectorAll('canvas').length,
          font: getComputedStyle(name).fontFamily, headingFont: getComputedStyle(heading).fontFamily,
          fits: rect.left >= parent.left && rect.right <= parent.right && rect.bottom <= parent.bottom,
          overflow: document.documentElement.scrollWidth - innerWidth,
          animation: getComputedStyle(art.querySelector('img')).animationName,
        }
      })
      assert.equal(result.name, 'Manuel García-Llera Añón')
      assert.equal(result.images, 1)
      assert.equal(result.canvases, 0)
      assert.equal(result.font, result.headingFont)
      assert.ok(result.fits)
      assert.ok(result.overflow <= 1)
      assert.deepEqual(errors, [])
      if (reducedMotion === 'reduce') assert.equal(result.animation, 'none')
      await page.locator('.rd-hero').screenshot({ path: `tmp/single-hero/${width}-${reducedMotion}.png` })
      console.log(JSON.stringify({ width, reducedMotion, ...result }))
      await page.close()
    }
  }
} finally { await browser.close() }
