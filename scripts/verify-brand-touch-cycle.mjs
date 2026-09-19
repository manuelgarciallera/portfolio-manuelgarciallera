import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Catch a truncated/reversing sweep and a visible snap back to the resting logo.
const css = await readFile('src/features/redesign/components/brand-signature.css', 'utf8')
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.setContent(`<style>${css}</style><div class="rd-brand-signature"><span class="rd-brand-m"><span class="rd-brand-m-color"></span></span></div>`)
  const mark = page.locator('.rd-brand-m')
  const rest = await mark.screenshot()
  await page.locator('.rd-brand-signature').evaluate(e => e.dataset.touchActive = 'true')
  const cycle = await page.evaluate(() => {
    const animations = document.getAnimations()
    animations.forEach(a => a.pause())
    const sweep = animations.find(a => a.animationName === 'rd-brand-touch-cycle')
    if (!sweep) return null
    return { duration: sweep.effect.getTiming().duration }
  })
  assert.ok(cycle, 'touch must travel through a full cycle, not just enlarge the gradient')
  assert.equal(cycle.duration, 1200)
  for (const [time, x] of [[0, -36], [300, -27], [600, -18], [900, -9], [1200, 0]]) {
    const actual = await page.evaluate(t => {
      document.getAnimations().forEach(a => { a.currentTime = t })
      return new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.rd-brand-m-color'), '::after').transform).m41
    }, time)
    assert.ok(Math.abs(actual - x) < 0.1, 'sweep travels one full tile in a single direction')
  }
  for (const time of [0, 600, 1200]) {
    await page.evaluate(t => document.getAnimations().forEach(a => { a.currentTime = t }), time)
    const rendered = await mark.screenshot()
    if (time === 600) assert.notDeepEqual(rendered, rest, 'middle of sweep is visibly different')
    else assert.deepEqual(rendered, rest, 'cycle endpoints match the original pixels')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0)
  console.log('PASS touch cycle: visible movement, 1.2s, identical endpoint pixels, reduced motion')
} finally { await browser.close() }
