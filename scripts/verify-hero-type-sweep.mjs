import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/hero-type-sweep', { recursive: true })
const browser = await chromium.launch()
try {
  for (const width of [390, 1280]) for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width, height: 712 } })
    await page.addInitScript(theme => {
      Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' })
      localStorage.setItem('rd-theme', theme)
    }, theme)
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    const title = page.locator('.rd-hero-copy h1')
    await title.waitFor()
    await page.waitForFunction(theme => getComputedStyle(document.querySelector('.rd-root')).backgroundColor ===
      (theme === 'dark' ? 'rgb(13, 14, 12)' : 'rgb(250, 250, 246)'), theme)
    const palette = await title.evaluate(el => {
      const s = getComputedStyle(el)
      return ['--bg', '--sweep-blue', '--sweep-violet', '--sweep-pink'].map(p => s.getPropertyValue(p).trim())
    })
    const luminance = hex => {
      const rgb = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255)
      return rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
        .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
    }
    const bg = luminance(palette[0])
    for (const color of palette.slice(1)) {
      const fg = luminance(color)
      assert.ok((Math.max(bg, fg) + .05) / (Math.min(bg, fg) + .05) >= 4.5, 'palette contrast')
    }
    const sample = time => title.evaluate((el, time) => {
      const animation = el.getAnimations().find(a => a.animationName === 'rd-hero-type-sweep')
      if (animation) { animation.pause(); animation.currentTime = time }
      const css = getComputedStyle(el), r = el.getBoundingClientRect()
      return { exists:!!animation, position:css.backgroundPositionX, image:css.backgroundImage,
        color:css.color, fill:css.webkitTextFillColor, duration:animation?.effect.getTiming().duration,
        width:r.width, height:r.height, top:r.top, text:el.textContent.trim() }
    }, time)
    const rest = await sample(0)
    assert.equal(rest.exists, true, 'headline has an occasional color sweep')
    assert.equal(rest.duration, 20000)
    assert.equal((await sample(5000)).position, rest.position, 'reading time before sweep')
    const mid = await sample(7000)
    assert.notEqual(mid.position, rest.position, 'color band crosses letters')
    assert.equal(mid.width, rest.width)
    assert.equal(mid.height, rest.height)
    assert.equal(mid.top, rest.top)
    await page.screenshot({ path:`.audit/hero-type-sweep/${width}-${theme}-sweep.png` })
    const after = await sample(9000)
    assert.equal((await sample(19000)).position, after.position, 'long quiet interval')
    assert.equal((await sample(27000)).position, mid.position, 'next sweep repeats after twenty seconds')
    assert.equal(await page.locator('h1').count(), 1)
    assert.match(rest.text, /Diseño sistemas digitales/)
    await page.emulateMedia({ reducedMotion:'reduce' })
    await page.waitForFunction(() => {
      const css = getComputedStyle(document.querySelector('.rd-hero-copy h1'))
      return css.animationName === 'none' && css.webkitTextFillColor === css.color
    })
    const reduced = await sample(7000)
    assert.equal(reduced.exists, false)
    assert.equal(reduced.image, 'none')
    assert.equal(reduced.fill, reduced.color, 'solid readable text without motion')
    await page.screenshot({ path:`.audit/hero-type-sweep/${width}-${theme}-static.png` })
    console.log('PASS sweep, quiet interval, recurrence, geometry, reduced motion', width, theme)
    await page.close()
  }
} finally { await browser.close() }
