import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/desktop-hero-fit', { recursive: true })
const browser = await chromium.launch()
try {
  for (const [width, height] of [[1280,720],[1366,768],[1440,900],[1920,1080],[1024,768],[768,600],[1280,600]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
    await context.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }))
    const page = await context.newPage()
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    const m = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s), r = e.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, font:parseFloat(getComputedStyle(e).fontSize), clipped:e.scrollWidth > e.clientWidth + 1 } }
      return { title:box('.rd-hero-copy h1'), cta:box('.rd-hero-copy a'), hero:box('.rd-hero'), art:box('.rd-hero-art'), header:box('.rd-header'), overflow:document.documentElement.scrollWidth > innerWidth }
    })
    console.log(width, height, m)
    assert.equal(m.overflow, false)
    assert.equal(m.title.clipped, false)
    assert.ok(Math.abs(m.hero.bottom - height) <= 1, 'hero ends at viewport edge')
    assert.ok(m.title.top >= m.header.bottom + 16, 'clear of navigation')
    assert.ok(m.cta.bottom <= height - 24, 'CTA fully inside viewport')
    assert.ok(m.art.bottom <= height, 'identity fully inside viewport')
    assert.ok(m.title.right <= m.art.left, 'copy and identity do not overlap')
    assert.ok(m.cta.top - m.title.bottom >= 34, 'more space before CTA')
    if (width >= 1280 && height >= 720) assert.ok(m.title.font >= height * .09, 'larger desktop headline')
    await page.screenshot({ path:`.audit/desktop-hero-fit/${width}x${height}.png` })
    await context.close()
  }
} finally { await browser.close() }
