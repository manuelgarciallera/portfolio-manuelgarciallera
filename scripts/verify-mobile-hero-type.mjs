import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
const output = '.audit/hero-mobile-type-2026-09-16'
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  for (const [width, height] of [[320,568],[360,640],[390,712],[390,844],[430,932],[600,800],[767,1024],[1280,720]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
    const page = await context.newPage(), tracking = [], errors = []
    page.on('request', r => { if (/umami\.is|google-analytics\.com|googletagmanager\.com|\/api\/web-vitals/.test(r.url())) tracking.push(r.url()) })
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' }).click()
    const measured = await page.evaluate(() => {
      const box = selector => { const el = document.querySelector(selector), r = el.getBoundingClientRect(), css = getComputedStyle(el)
        return { top:r.top, bottom:r.bottom, font:parseFloat(css.fontSize), line:parseFloat(css.lineHeight), clipped:el.scrollWidth>el.clientWidth+1 } }
      return { title:box('.rd-hero-copy h1'), cta:box('.rd-hero-copy a'), art:box('.rd-hero-art'),
        hero:box('.rd-hero'), header:box('.rd-header'), overflow:document.documentElement.scrollWidth>innerWidth }
    })
    assert.equal(measured.overflow, false)
    assert.equal(measured.title.clipped, false)
    assert.ok(measured.title.top >= measured.header.bottom + 16)
    assert.ok(measured.cta.bottom <= height - 16)
    if (width < 768) {
      assert.ok(measured.title.line / measured.title.font >= 1.03, 'more breathing room between lines')
      assert.ok(measured.cta.top - measured.title.bottom >= 32, 'clear separation before CTA')
      assert.ok(measured.title.top <= Math.max(160, height * .2), 'title starts in the marked upper area')
      assert.ok(measured.cta.top >= height * .78, 'CTA occupies the marked lower area')
      assert.ok(Math.abs(measured.art.top - height) <= 1, 'sphere starts after initial viewport')
      if (width === 390) assert.ok(measured.title.font >= 50, 'larger title on reference mobile')
    } else assert.ok(Math.abs(measured.hero.bottom - height) <= 1, 'desktop unchanged')
    assert.deepEqual(tracking, [])
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `${output}/${width}x${height}.png` })
    console.log('PASS', width, height, JSON.stringify(measured))
    await context.close()
  }
} finally { await browser.close() }
