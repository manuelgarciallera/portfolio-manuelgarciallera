import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.argv[2] || 'http://localhost:3040'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await page.goto(base, { waitUntil: 'networkidle' })
  const signature = page.locator('.rd-brand-signature')
  const color = page.locator('.rd-brand-m-color')
  await page.waitForTimeout(800)
  // Capture the short pulse within the browser: separate protocol round trips
  // can outlast the pulse while software WebGL renders the Hero in headless CI.
  const response = await signature.evaluate(async e => {
    e.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch', isPrimary:true }))
    await new Promise(resolve => setTimeout(resolve, 30))
    return {
      gradient: getComputedStyle(e.querySelector('.rd-brand-m-color'), '::after').animationName,
      halo: getComputedStyle(e.querySelector('.rd-brand-m')).animationName,
      letters: getComputedStyle(e.querySelector('.rd-brand-letters')).display,
    }
  })
  assert.equal(response.gradient, 'rd-brand-touch-cycle', 'touch starts a complete gradient cycle')
  assert.equal(response.halo, 'rd-brand-touch-glow', 'touch starts subtle halo')
  assert.equal(response.letters, 'none')
  await page.waitForTimeout(1300)
  assert.equal(await signature.getAttribute('data-touch-active'), 'false', 'cycle clears after holding')
  assert.equal(await color.evaluate(e => getComputedStyle(e, '::after').animationName), 'none', 'held touch does not leave a sticky effect')
  await signature.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true })
  await signature.dispatchEvent('pointercancel', { pointerType: 'touch' })
  await page.waitForTimeout(50)
  assert.equal(await color.evaluate(e => getComputedStyle(e, '::after').animationName), 'none', 'scroll cancellation clears feedback')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await signature.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true })
  assert.equal(await color.evaluate(e => getComputedStyle(e, '::after').animationName), 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${base}/sobre-mi`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.locator('.rd-brand').tap()
  await page.waitForURL(`${base}/`)
  await page.evaluate(() => scrollTo({top:600,behavior:'instant'}))
  await page.waitForTimeout(100)
  await page.evaluate(() => scrollTo({top:400,behavior:'instant'}))
  await page.waitForTimeout(400)
  const bounds = await page.locator('.rd-brand-m').boundingBox()
  const client = await page.context().newCDPSession(page)
  const point = {x:bounds.x+18,y:bounds.y+18}
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]})
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y+100}]})
  await page.waitForTimeout(180)
  const scrolled = await page.evaluate(() => scrollY)
  assert.ok(scrolled>0&&scrolled<400, `drag starting on the logo scrolls the page: ${scrolled}`)
  assert.equal(await signature.getAttribute('data-touch-active'),'false', 'native pan cancels the halo')
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  console.log('PASS mobile touch: pulse, halo, no letters, timeout, cancel, reduced motion, real tap navigation, native pan')
} finally { await browser.close() }
