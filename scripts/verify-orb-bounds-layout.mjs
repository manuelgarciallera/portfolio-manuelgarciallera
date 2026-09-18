import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3040'
const baseline = process.env.ORB_BASELINE_URL || 'https://manuelgarciallera.com'
await mkdir('.audit/orb-bounds', { recursive: true })
const browser = await chromium.launch()
try {
  for (const width of [390, 768, 1024, 1280, 1920]) {
    const measurements = []
    for (const url of [baseline, base]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } })
      await page.addInitScript(() => {
        localStorage.setItem('rd-theme', 'dark')
        Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' })
        const names = new WeakMap()
        const get = WebGLRenderingContext.prototype.getUniformLocation
        const set = WebGLRenderingContext.prototype.uniform1f
        WebGLRenderingContext.prototype.getUniformLocation = function (p, n) {
          const l = get.call(this, p, n); if (l) names.set(l, n); return l
        }
        WebGLRenderingContext.prototype.uniform1f = function (l, v) {
          if (names.get(l) === 'cameraZoom') window.orbZoom = v
          return set.call(this, l, names.get(l) === 'time' ? 8 : v)
        }
      })
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.locator('.rd-hero-canvas-stage').scrollIntoViewIfNeeded()
      await page.waitForFunction(() => document.querySelector('.rd-hero-art')?.dataset.ready === 'true' && window.orbZoom)
      await page.evaluate(() => document.fonts.ready)
      const result = await page.evaluate(() => {
        const box = (selector) => {
          const r = document.querySelector(selector).getBoundingClientRect()
          return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }
        }
        const stage = box('.rd-hero-canvas-stage'), canvas = box('.rd-hero-canvas')
        return { stage, canvas, name: box('.rd-hero-name'), hero: box('.rd-hero'),
          scale: canvas.h * window.orbZoom,
          overflow: document.documentElement.scrollWidth > innerWidth,
          artOverflow: getComputedStyle(document.querySelector('.rd-hero-art')).overflow }
      })
      measurements.push(result)
      if (url === base) {
        assert.ok(result.canvas.w >= result.canvas.h - 1, 'calculated sphere bound fits the horizontal frustum too')
        assert.equal(result.overflow, false, 'no horizontal page overflow')
        assert.equal(result.artOverflow, 'visible', 'container cannot re-clip the expanded canvas')
        assert.ok(result.canvas.h > result.stage.h * 1.3, 'real CSS exposes safety frame')
        if ([390, 1280].includes(width)) await page.screenshot({ path: `.audit/orb-bounds/${width}.png` })
      }
      await page.close()
    }
    const [before, after] = measurements
    for (const key of ['stage', 'name', 'hero']) for (const axis of ['x', 'y', 'w', 'h']) {
      assert.ok(Math.abs(before[key][axis] - after[key][axis]) < 1, `${width}: preserve ${key}.${axis}`)
    }
    assert.ok(Math.abs(before.scale - after.scale) < .1, 'exact apparent liquid scale is preserved')
    console.log('PASS frame, unchanged layout and liquid scale', width, after)
  }
} finally { await browser.close() }
