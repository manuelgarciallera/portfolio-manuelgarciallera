import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/hero-theme-transparency', { recursive:true })
const browser = await chromium.launch()
try {
  for (const width of [390,1280]) for (const reducedMotion of ['reduce','no-preference']) {
    const page = await browser.newPage({ viewport:{ width, height:800 }, reducedMotion })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'doNotTrack', { get:() => '1' })
      localStorage.setItem('rd-theme', 'dark')
    })
    await page.goto(base, { waitUntil:'domcontentloaded' })
    const art = page.locator('.rd-hero-art')
    assert.equal(await art.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', 'scene container is transparent')
    if (reducedMotion === 'no-preference') await page.waitForSelector('.rd-hero-art[data-ready="true"]', { timeout:90000 })
    else await page.waitForSelector('.rd-hero-static-orb', { state:'attached' })
    for (const theme of ['light','dark']) {
      await page.evaluate(() => window.scrollTo({ top:0, behavior:'instant' }))
      await page.waitForSelector('.rd-header.is-visible')
      if (width < 768) {
        await page.locator('.rd-menu-btn').click()
        await page.waitForSelector('.rd-header.menu-open')
      }
      await page.locator('.rd-header .rd-theme-btn:visible').click()
      await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme)
      await page.evaluate(() => {
        const root = document.querySelector('.rd-root')
        for (const animation of root.getAnimations()) {
          animation.pause()
          animation.currentTime = 250
        }
      })
      if (width < 768) await page.locator('.rd-menu-btn').click()
      await art.scrollIntoViewIfNeeded()
      const expected = await page.locator('.rd-root').evaluate(el => getComputedStyle(el).backgroundColor.match(/\d+/g).slice(0,3).map(Number))
      const screenshot = await art.screenshot({ path:`.audit/hero-theme-transparency/${width}-${reducedMotion}-${theme}.png`, animations:'allow' })
      const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject:true })
      for (const [x,y] of [[4,4],[info.width-5,4],[4,info.height-5],[info.width-5,info.height-5]]) {
        const pixel = Array.from(data.subarray((y*info.width+x)*3,(y*info.width+x)*3+3))
        assert.ok(pixel.every((v,i) => Math.abs(v-expected[i]) <= 3), `scene corner matches page during ${theme} transition: ${pixel} vs ${expected}`)
      }
      await page.evaluate(() => document.querySelector('.rd-root').getAnimations().forEach(a => a.finish()))
      console.log('PASS transparent scene transition', width, reducedMotion, theme)
    }
    await page.close()
  }
} finally { await browser.close() }
