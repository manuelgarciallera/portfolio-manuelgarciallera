import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import {chromium} from 'playwright'
const browser = await chromium.launch()
const base = process.argv[2] || 'http://localhost:3040'
try {
  const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true})
  await page.goto(base,{waitUntil:'networkidle',timeout:60000})
  const cdp = await page.context().newCDPSession(page)
  const pressed = []
  for (const selector of ['.rd-mobile-nav-contact','.rd-hero-copy a']) {
    if (selector.includes('nav')) await page.getByRole('button',{name:'Abrir menú',exact:true}).click()
    const target = page.locator(selector)
    await target.scrollIntoViewIfNeeded()
    const before = await target.evaluate(e=>getComputedStyle(e).boxShadow)
    const bounds = await target.boundingBox()
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2}]})
    await page.waitForTimeout(150)
    const during = await target.evaluate(e=>getComputedStyle(e).boxShadow)
    assert.notEqual(during,before,'press visibly changes the shadow')
    pressed.push(during)
    if (selector.includes('nav')) {
      await mkdir('.audit/action-feedback', { recursive: true })
      await page.screenshot({path:'.audit/action-feedback/pressed.png'})
    }
    assert.deepEqual(await target.boundingBox(),bounds,'feedback does not move the target')
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
    await page.waitForTimeout(400)
    assert.equal(await target.evaluate(e=>getComputedStyle(e).boxShadow),before,'cancel clears the feedback')
    if(selector.includes('nav')) await page.keyboard.press('Escape')
  }
  assert.equal(pressed[0],pressed[1],'both CTAs share the same press recipe')
  console.log('PASS shared feedback: native touch, visible shadow, no layout shift, cancel restores, same recipe')
} finally {await browser.close()}
