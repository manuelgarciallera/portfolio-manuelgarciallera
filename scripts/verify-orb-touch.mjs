import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const base=process.env.HERO_TEST_URL||'http://localhost:3015'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await chromium.launch()
try {
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:800},hasTouch:true})
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
   localStorage.setItem('rd-theme','dark')
   window.drawCount=0;window.strength=0
   const names=new WeakMap(),get=WebGLRenderingContext.prototype.getUniformLocation,set=WebGLRenderingContext.prototype.uniform1f,draw=WebGLRenderingContext.prototype.drawArrays
   WebGLRenderingContext.prototype.getUniformLocation=function(p,n){const loc=get.call(this,p,n);if(loc)names.set(loc,n);return loc}
   WebGLRenderingContext.prototype.uniform1f=function(loc,v){if(this.canvas.closest('.rd-hero-art')&&names.get(loc)==='pressStrength')window.strength=v;return set.call(this,loc,v)}
   WebGLRenderingContext.prototype.drawArrays=function(...args){if(this.canvas.closest('.rd-hero-art'))window.drawCount++;return draw.apply(this,args)}
  })
  await page.goto(base,{waitUntil:'domcontentloaded'})
  const canvas=page.locator('.rd-hero-canvas')
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>window.drawCount>4)
  const r=await canvas.boundingBox()
  await canvas.dispatchEvent('pointerdown',{pointerType:'touch',isPrimary:true,clientX:r.x+r.width*.55,clientY:r.y+r.height*.45})
  await page.evaluate(()=>window.dispatchEvent(new Event('touchstart')))
  const before=await page.evaluate(()=>window.drawCount)
  await page.waitForTimeout(400)
  assert.ok(await page.evaluate(()=>window.drawCount)>before,'holding a finger must not freeze the orb')
  assert.ok(await page.evaluate(()=>window.strength)>0,'press reaches the real shader as a deformation impulse')
  // No pointerup/touchend: a lost release event must not leave a persistent state.
  await page.waitForFunction(()=>window.strength===0)
  const recovered=await page.evaluate(()=>window.drawCount)
  await page.waitForFunction(n=>window.drawCount>n,recovered)
  if(width<768){
   const result=await page.evaluate(async()=>{
    const y=scrollY;for(let i=0;i<8;i++){scrollBy({top:4,behavior:'instant'});await new Promise(r=>setTimeout(r,60))}
    const before=window.drawCount;await new Promise(r=>setTimeout(r,60));return{before,after:window.drawCount,moved:scrollY!==y}
   })
   assert.ok(result.moved);assert.equal(result.before,result.after,'real scrolling still suspends expensive drawing')
   await page.waitForFunction(n=>window.drawCount>n,result.after)
  }
  console.log('PASS touch does not freeze, finite reaction, scroll recovery',width)
  await page.close()
 }
}finally{await browser.close()}
