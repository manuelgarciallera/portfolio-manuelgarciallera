import assert from 'node:assert/strict'
import {chromium,firefox} from 'playwright'
const base=process.env.HERO_TEST_URL||'http://127.0.0.1:3020'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await (process.env.HERO_TEST_BROWSER==='firefox'?firefox:chromium).launch()
try {
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:800}})
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
   window.orbInput={strength:0,time:0,x:0,y:0}
   const names=new WeakMap(),get=WebGLRenderingContext.prototype.getUniformLocation,set=WebGLRenderingContext.prototype.uniform1f,set2=WebGLRenderingContext.prototype.uniform2f
   WebGLRenderingContext.prototype.getUniformLocation=function(p,n){const l=get.call(this,p,n);if(l)names.set(l,n);return l}
   WebGLRenderingContext.prototype.uniform1f=function(l,v){if(this.canvas.closest('.rd-hero-art')){if(names.get(l)==='pressStrength')window.orbInput.strength=v;if(names.get(l)==='time')window.orbInput.time=v}return set.call(this,l,v)}
   WebGLRenderingContext.prototype.uniform2f=function(l,x,y){if(this.canvas.closest('.rd-hero-art')&&names.get(l)==='pressPoint'){window.orbInput.x=x;window.orbInput.y=y}return set2.call(this,l,x,y)}
  })
  await page.goto(base,{waitUntil:'domcontentloaded'})
  const canvas=page.locator('.rd-hero-canvas');await canvas.scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>window.orbInput.time>0)
  const r=await canvas.boundingBox(),x=r.x+r.width*.5,y=r.y+r.height*.5
  await page.mouse.move(x,y)
  await page.waitForTimeout(600)
  if(width<768){assert.equal(await page.evaluate(()=>window.orbInput.strength),0,'compact layout does not activate hover');await page.close();continue}
  const hovered=await page.evaluate(()=>({...window.orbInput}))
  assert.ok(hovered.strength>.1&&hovered.strength<.6,'hover gently deforms without a click')
  await page.waitForTimeout(1800)
  assert.ok(await page.evaluate(()=>window.orbInput.time)>hovered.time,'stationary hover keeps fluid moving')
  assert.ok(await page.evaluate(()=>window.orbInput.strength)>.1,'stationary cursor keeps interaction alive')
  await page.mouse.move(x+25,y-15)
  await page.waitForTimeout(200)
  assert.notEqual(await page.evaluate(()=>window.orbInput.x),hovered.x,'deformation follows cursor')
  await page.mouse.down();await page.waitForTimeout(200)
  assert.ok(await page.evaluate(()=>window.orbInput.strength)>.8,'click remains stronger than hover')
  await page.mouse.up();await page.waitForTimeout(1800)
  assert.ok(await page.evaluate(()=>window.orbInput.strength)>.1,'release over the orb returns to hover')
  await page.mouse.move(4,4);await page.waitForTimeout(150)
  const fading=await page.evaluate(()=>window.orbInput.strength)
  assert.ok(fading>0&&fading<.6,'leaving fades rather than sticking or snapping')
  await page.waitForFunction(()=>window.orbInput.strength===0)
  await page.mouse.move(x,y);await page.waitForTimeout(200)
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')))
  await page.waitForFunction(()=>window.orbInput.strength===0)
  console.log('PASS desktop hover, tracking, held click, exit and blur')
  await page.close()
 }
}finally{await browser.close()}
