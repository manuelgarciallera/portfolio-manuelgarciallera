import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/hero-cta-border', { recursive: true })
const browser = await chromium.launch()
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 712 } })
    await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }))
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    const cta = page.locator('.rd-hero-copy a')
    await cta.waitFor()
    const style = () => cta.evaluate(el => {
      const s = getComputedStyle(el, '::before'), r = el.getBoundingClientRect()
      return { image:s.backgroundImage, animation:s.animationName, duration:s.animationDuration,
        angle:s.getPropertyValue('--rd-cta-angle'), pointer:s.pointerEvents,
        width:r.width, height:r.height, bottom:r.bottom }
    })
    const first = await style()
    assert.match(first.image, /conic-gradient/, 'visible colored border')
    assert.notEqual(first.animation, 'none', 'border animates')
    assert.equal(first.pointer, 'none', 'decoration cannot intercept clicks')
    await page.waitForTimeout(250)
    assert.notEqual((await style()).angle, first.angle, 'gradient actually progresses')
    await page.emulateMedia({ reducedMotion:'reduce' })
    const reduced = await style()
    assert.equal(reduced.animation, 'none')
    assert.equal(reduced.width, first.width)
    assert.equal(reduced.height, first.height)
    assert.ok(reduced.bottom <= 712)
    await cta.focus()
    assert.equal(await cta.evaluate(el => el.matches(':focus-visible')), true)
    await page.screenshot({ path:`.audit/hero-cta-border/${width}.png` })
    await cta.click()
    await page.waitForURL(/#casos/, { waitUntil: 'domcontentloaded' })
    console.log('PASS border, motion, reduced motion, geometry, focus, link', width)
    await page.close()
  }
} finally { await browser.close() }
