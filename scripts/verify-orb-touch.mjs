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
   window.drawCount=0;window.strength=0;window.orbTime=0
   const names=new WeakMap(),get=WebGLRenderingContext.prototype.getUniformLocation,set=WebGLRenderingContext.prototype.uniform1f,draw=WebGLRenderingContext.prototype.drawArrays
   WebGLRenderingContext.prototype.getUniformLocation=function(p,n){const loc=get.call(this,p,n);if(loc)names.set(loc,n);return loc}
   WebGLRenderingContext.prototype.uniform1f=function(loc,v){if(this.canvas.closest('.rd-hero-art')){if(names.get(loc)==='pressStrength')window.strength=v;if(names.get(loc)==='time')window.orbTime=v}return set.call(this,loc,v)}
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
  await page.waitForTimeout(2000)
  assert.ok(await page.evaluate(()=>window.strength)>.5,'held contact keeps the deformation alive beyond the old impulse')
  const heldTime=await page.evaluate(()=>window.orbTime)
  await page.waitForTimeout(300)
  assert.ok(await page.evaluate(()=>window.orbTime)>heldTime,'fluid keeps moving during a long press')
  const menuBlocked=await canvas.evaluate(e=>!e.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})))
  assert.ok(menuBlocked,'native long-press menu is suppressed only on the decorative canvas')
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:0})))
  await page.waitForFunction(()=>window.strength===0)
  for(const ending of ['pointercancel','blur']){
   await canvas.dispatchEvent('pointerdown',{pointerId:9,pointerType:'touch',isPrimary:true,clientX:r.x+r.width*.55,clientY:r.y+r.height*.45})
   await page.waitForFunction(()=>window.strength>.5)
   await page.evaluate(ending=>window.dispatchEvent(ending==='blur'?new Event('blur'):new PointerEvent(ending,{pointerId:9})),ending)
   await page.waitForFunction(()=>window.strength===0)
  }
  const recovered=await page.evaluate(()=>window.drawCount)
  await page.waitForFunction(n=>window.drawCount>n,recovered)
  if(width<768){
   // Real browser touch dispatch, not just a synthetic DOM pointer event.
   const client=await page.context().newCDPSession(page)
   const box=await canvas.boundingBox()
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.5,y:box.y+box.height*.5}]})
   await page.waitForTimeout(2400)
   assert.ok(await page.evaluate(()=>window.strength)>.5,'native held touch remains active')
   const held=await page.evaluate(()=>window.orbTime)
   await page.waitForTimeout(300)
   assert.ok(await page.evaluate(()=>window.orbTime)>held,'native long touch does not freeze shader time')
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
   await page.waitForFunction(()=>window.strength===0)
   await client.detach()
   const result=await page.evaluate(async()=>{
    const y=scrollY,before=window.drawCount,timeBefore=window.orbTime;let moved=false
    for(let i=0;i<16;i++){scrollBy({top:i<8?4:-4,behavior:'instant'});await new Promise(r=>setTimeout(r,60));if(i===7)moved=scrollY!==y}
    return{before,after:window.drawCount,moved,timeBefore,timeAfter:window.orbTime}
   })
   assert.ok(result.moved);assert.ok(result.after-result.before>4,'orb must keep animating throughout real down/up scrolling')
   assert.ok(result.timeAfter>result.timeBefore,'scrolling advances the actual shader time, not repeated frozen frames')
   await page.waitForFunction(n=>window.drawCount>n,result.after)
  }
  console.log('PASS sustained touch, release/cancel/blur recovery, continuous scroll',width)
  await page.close()
 }
}finally{await browser.close()}
