import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/hero-cta-border', { recursive: true })
const browser = await chromium.launch()
try {
  for (const width of [390, 1280]) for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width, height: 712 }, hasTouch:width < 768 })
    await page.addInitScript(theme => {
      Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' })
      localStorage.setItem('rd-theme', theme)
    }, theme)
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    const cta = page.locator('.rd-hero-copy a')
    await cta.waitFor()
    assert.equal(await cta.locator('.rd-cta-glow[aria-hidden="true"]').count(), 1, 'capsule contour has an independent blur layer')
    await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme)
    const style = () => cta.evaluate(el => {
      const layer = el.querySelector('.rd-cta-glow')
      const s = getComputedStyle(el, '::before'), glow = getComputedStyle(layer, '::before'), halo = getComputedStyle(layer), own = getComputedStyle(el), r = el.getBoundingClientRect()
      return { image:s.backgroundImage, animation:s.animationName, duration:s.animationDuration,
        angle:s.getPropertyValue('--rd-cta-angle'), pointer:s.pointerEvents,
        glowImage:glow.backgroundImage, glowFilter:halo.filter, glowOpacity:parseFloat(halo.opacity),
        mask:glow.maskImage, radius:halo.borderRadius, ctaRadius:own.borderRadius,
        glowAngle:glow.getPropertyValue('--rd-cta-angle'), glowAnimation:glow.animationName, glowPointer:glow.pointerEvents,
        backdrop:own.backdropFilter, surface:own.backgroundImage, fill:own.backgroundColor, color:own.color,
        width:r.width, height:r.height, bottom:r.bottom }
    })
    const first = await style()
    assert.equal(first.duration, '4.4s', 'intro rotation is slightly faster')
    assert.doesNotMatch(first.mask, /radial-gradient/, 'halo follows capsule, not an ellipse')
    assert.equal(first.radius, first.ctaRadius, 'same pill radius')
    assert.match(first.image, /conic-gradient/, 'visible colored border')
    assert.match(first.glowImage, /conic-gradient/, 'colored exterior halo')
    assert.match(first.glowFilter, /blur/, 'soft halo, not another hard outline')
    assert.ok(first.glowOpacity >= .55 && first.glowOpacity <= .8, 'stronger but controlled neon halo')
    const colors = [...first.glowImage.matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)]
    assert.ok(colors.length >= 3)
    for (const color of colors) {
      const channels = color.slice(1).map(Number)
      assert.ok((Math.max(...channels) - Math.min(...channels)) / Math.max(...channels) >= .65, 'vivid neon saturation')
    }
    assert.equal(first.glowPointer, 'none')
    assert.notEqual(first.animation, 'none', 'border animates')
    assert.equal(first.pointer, 'none', 'decoration cannot intercept clicks')
    await page.waitForTimeout(250)
    const moving = await style()
    assert.notEqual(moving.angle, first.angle, 'gradient actually progresses')
    assert.equal(moving.glowAngle, moving.angle, 'halo and border stay synchronized')
    await cta.hover()
    if (width >= 768) {
      await page.waitForFunction(() => {
        const css = getComputedStyle(document.querySelector('.rd-hero-copy a'))
        // Read the finished 180ms surface transition, not its opaque first frame.
        return css.backdropFilter.includes('blur') && css.backgroundColor.endsWith(', 0.86)')
      })
      const glass = await style()
      assert.equal(glass.duration, '7.3s', 'hover rotation is slightly faster')
      assert.match(glass.surface, /linear-gradient/, 'glass reflection')
      assert.match(glass.fill, /rgba/, 'translucent glass surface')
      assert.equal(glass.color, first.color, 'readable label retained')
      assert.equal(glass.width, first.width)
      assert.equal(glass.height, first.height)
      await page.screenshot({ path:`.audit/hero-cta-border/${width}-${theme}-glass.png` })
    } else assert.equal((await style()).backdrop, 'none', 'touch does not acquire glass hover')
    await page.mouse.move(0, 0)
    await page.emulateMedia({ reducedMotion:'reduce' })
    const reduced = await style()
    assert.equal(reduced.animation, 'none')
    assert.equal(reduced.glowAnimation, 'none')
    assert.equal(reduced.width, first.width)
    assert.equal(reduced.height, first.height)
    assert.ok(reduced.bottom <= 712)
    await cta.focus()
    assert.equal(await cta.evaluate(el => el.matches(':focus-visible')), true)
    await cta.evaluate(el => el.blur())
    await page.screenshot({ path:`.audit/hero-cta-border/${width}-${theme}.png` })
    await cta.click()
    await page.waitForURL(/#casos/, { waitUntil: 'domcontentloaded' })
    console.log('PASS neon, glass, motion, reduced motion, geometry, focus, link', width, theme)
    await page.close()
  }
} finally { await browser.close() }
