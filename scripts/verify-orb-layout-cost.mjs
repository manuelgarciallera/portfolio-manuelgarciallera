import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base=process.env.HERO_TEST_URL||'http://127.0.0.1:3015'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await chromium.launch()
try {
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:800}})
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
   localStorage.setItem('rd-theme','dark')
   window.orbReads=0;window.orbDraws=0
   const rect=Element.prototype.getBoundingClientRect,draw=WebGLRenderingContext.prototype.drawArrays
   Element.prototype.getBoundingClientRect=function(...args){if(this.matches('.rd-hero-canvas'))window.orbReads++;return rect.apply(this,args)}
   WebGLRenderingContext.prototype.drawArrays=function(...args){if(this.canvas.matches('.rd-hero-canvas'))window.orbDraws++;return draw.apply(this,args)}
  })
  await page.goto(base,{waitUntil:'domcontentloaded'})
  const canvas=page.locator('.rd-hero-canvas')
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>window.orbDraws>6)
  const before=await page.evaluate(()=>({reads:window.orbReads,draws:window.orbDraws}))
  await page.waitForFunction(n=>window.orbDraws>=n+12,before.draws)
  const after=await page.evaluate(()=>({reads:window.orbReads,draws:window.orbDraws}))
  console.log({width,before,after})
  assert.equal(after.reads-before.reads,0,'steady animation must not synchronously measure layout per frame')
  // A real CSS size change must invalidate the cache without a window resize.
  await canvas.evaluate(e=>e.style.setProperty('width','160px','important'))
  await page.waitForFunction(()=>{
   const c=document.querySelector('.rd-hero-canvas')
   const r=c.getBoundingClientRect(),overscan=parseFloat(getComputedStyle(c).getPropertyValue('--orb-overscan'))||1
   const ratio=Math.min(1.25,(innerWidth<768?384:560)*overscan/Math.max(r.width,r.height))
   return c.width===Math.round(160*ratio)&&c.height===Math.round(r.height*ratio)
  })
  const resized=await page.evaluate(()=>window.orbDraws)
  await page.waitForFunction(n=>window.orbDraws>n+2,resized)
  console.log('PASS cached layout and resize without frozen animation',width)
  await page.close()
 }
}finally{await browser.close()}
