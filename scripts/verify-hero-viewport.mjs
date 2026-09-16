import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = '.audit/hero-viewport-2026-09-16'
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const results = []
const cases = [[1280,720,1],[1366,768,1],[1440,900,1],[1920,1080,1],
  [1024,600,1],[768,1024,1],[320,568,1],[360,640,1],[390,844,1],[430,932,1],
  [390,844,2],[1280,720,2]]
try {
  for (const [width,height,scale] of cases) {
    const context = await browser.newContext({viewport:{width,height}, reducedMotion:'reduce'})
    const page = await context.newPage()
    await page.goto(base, {waitUntil:'domcontentloaded'})
    await page.locator('.rd-hero-name').waitFor()
    await page.waitForFunction(() => {
      const orb = document.querySelector('.rd-hero-static-orb')
      return orb instanceof HTMLImageElement && orb.complete && orb.naturalWidth > 0
    })
    const dismiss = page.getByRole('button', {name:'Cerrar preferencias sin cambiar la elección'})
    if (await dismiss.count()) await dismiss.click()
    await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale * 16}px`; window.scrollTo(0,0) }, scale)
    const measured = await page.evaluate(() => {
      const box = selector => { const el = document.querySelector(selector), r = el.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,font:parseFloat(getComputedStyle(el).fontSize),
          clipped:el.scrollWidth>el.clientWidth+1} }
      return {hero:box('.rd-hero'), title:box('.rd-hero-copy h1'), cta:box('.rd-hero-copy a'),
        art:box('.rd-hero-art'), name:box('.rd-hero-name'), header:box('.rd-header'),
        scrollY, overflow:document.documentElement.scrollWidth>innerWidth}
    })
    const label = `${width}x${height}-${scale}x`
    assert.equal(measured.scrollY,0,label)
    assert.equal(measured.overflow,false,`${label}: no horizontal scroll`)
    assert.equal(measured.title.clipped,false,`${label}: heading not clipped`)
    assert.ok(measured.title.top>=measured.header.bottom+8,`${label}: header clears heading`)
    assert.ok(measured.cta.top>=measured.title.bottom,`${label}: CTA follows heading`)
    assert.ok(measured.name.font<measured.title.font*.8,`${label}: heading has visual priority`)
    assert.ok(measured.name.bottom<=measured.art.bottom+1,`${label}: complete name`)
    if (scale===1) {
      assert.ok(measured.cta.bottom<=height-16,`${label}: CTA fits first viewport: ${JSON.stringify(measured)}`)
      if (width>=768) assert.ok(Math.abs(measured.hero.bottom-height)<=1,`${label}: hero divider at viewport edge: ${measured.hero.bottom}`)
      else assert.ok(Math.abs(measured.art.top-height)<=1,`${label}: sphere begins below first viewport: ${measured.art.top}`)
    }
    await page.screenshot({path:`${output}/${label}.png`})
    results.push({label,...measured})
    await context.close()
  }
  console.log(JSON.stringify({result:'PASS',results,output}))
} finally {await browser.close()}
