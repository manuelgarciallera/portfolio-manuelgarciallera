import assert from 'node:assert/strict'
import {chromium,firefox} from 'playwright'
const base=process.env.HERO_TEST_URL||'http://127.0.0.1:3020'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await (process.env.HERO_TEST_BROWSER==='firefox'?firefox:chromium).launch()
try {
 for(const [width,motion,touch] of [[1280,'no-preference',false],[390,'no-preference',true],[1280,'reduce',false],[1280,'no-preference',true]]) {
  const page=await browser.newPage({viewport:{width,height:800},reducedMotion:motion,hasTouch:touch})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
   window.bubbleDraws=0
   const arc=CanvasRenderingContext2D.prototype.arc
   CanvasRenderingContext2D.prototype.arc=function(...args){if(this.canvas.className==='rd-orb-bubbles'&&this.globalAlpha>0.05)window.bubbleDraws++;return arc.apply(this,args)}
  })
  await page.goto(base,{waitUntil:'domcontentloaded'})
  if(motion==='reduce') await page.locator('.rd-hero-static-orb').waitFor({state:'attached'})
  else await page.locator('.rd-hero-art[data-ready=true]').waitFor({state:'attached',timeout:60000})
  await page.evaluate(()=>document.fonts.ready)
  const enabled=await page.evaluate(()=>matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches)
  const layer=page.locator('.rd-orb-bubbles')
  if(!enabled){await page.waitForTimeout(500);assert.equal(await layer.count(),0)}
  else {
   await layer.waitFor({state:'attached'})
   assert.equal(await layer.count(),1)
   assert.equal(await layer.evaluate(e=>getComputedStyle(e).pointerEvents),'none')
   assert.equal(await layer.getAttribute('aria-hidden'),'true')
   const r=await page.locator('.rd-hero-canvas').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2
   await page.mouse.move(x+110,y);await page.waitForTimeout(15);await page.mouse.move(x-100,y-10)
   await page.waitForFunction(()=>window.bubbleDraws>0)
   await page.waitForTimeout(2800)
   assert.equal(await layer.evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return d.some((v,i)=>i%4===3&&v>0)}),false,'fully dissolved')
   const draws=await page.evaluate(()=>window.bubbleDraws);await page.waitForTimeout(250)
   assert.equal(await page.evaluate(()=>window.bubbleDraws),draws,'idle drawing stops')
   await page.emulateMedia({reducedMotion:'reduce'});await layer.waitFor({state:'detached'})
   await page.emulateMedia({reducedMotion:'no-preference'});await layer.waitFor({state:'attached'})
   await page.setViewportSize({width:390,height:800});await layer.waitFor({state:'detached'})
  }
  assert.deepEqual(errors,[]);console.log('PASS bubbles',width,motion,'touch',touch);await page.close()
 }
} finally {await browser.close()}
