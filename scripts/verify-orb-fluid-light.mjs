import assert from 'node:assert/strict'
import {chromium,firefox} from 'playwright'
const base=process.env.HERO_TEST_URL||'http://127.0.0.1:3020'
assert.ok(['127.0.0.1','localhost','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await (process.env.HERO_TEST_BROWSER==='firefox'?firefox:chromium).launch()
try {
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:800}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
   window.lightProbe={strength:0,x:0,y:0,time:0}
   const names=new WeakMap(),get=WebGLRenderingContext.prototype.getUniformLocation,one=WebGLRenderingContext.prototype.uniform1f,two=WebGLRenderingContext.prototype.uniform2f
   WebGLRenderingContext.prototype.getUniformLocation=function(p,n){const l=get.call(this,p,n);if(l)names.set(l,n);return l}
   WebGLRenderingContext.prototype.uniform1f=function(l,v){if(this.canvas.className==='rd-hero-canvas'){if(names.get(l)==='lightStrength')window.lightProbe.strength=v;if(names.get(l)==='time')window.lightProbe.time=v}return one.call(this,l,v)}
   WebGLRenderingContext.prototype.uniform2f=function(l,x,y){if(names.get(l)==='lightPoint'){window.lightProbe.x=x;window.lightProbe.y=y}return two.call(this,l,x,y)}
  })
  await page.goto(base,{waitUntil:'domcontentloaded'})
  const canvas=page.locator('.rd-hero-canvas');await canvas.scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>window.lightProbe.time>0)
  const r=await canvas.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2
  await page.mouse.move(x-35,y);await page.waitForTimeout(400)
  const initial=await page.evaluate(()=>({...window.lightProbe}))
  if(width<768)assert.equal(initial.strength,0,'mobile has no cursor light')
  else {
   assert.ok(initial.strength>.2,'desktop cursor activates internal light')
   assert.equal(await page.locator('.rd-orb-bubbles').count(),0,'external bubbles removed')
   await page.mouse.move(x+60,y-20);await page.waitForTimeout(600)
   const moved=await page.evaluate(()=>({...window.lightProbe}))
   assert.ok(moved.x>initial.x,'light follows cursor')
   await page.mouse.down();await page.waitForTimeout(500)
   assert.ok(await page.evaluate(()=>window.lightProbe.time)>moved.time,'held click does not freeze fluid')
   await page.mouse.up();await page.mouse.move(2,2);await page.waitForTimeout(1500)
   console.log('exit light',await page.evaluate(()=>window.lightProbe))
   assert.ok(await page.evaluate(()=>window.lightProbe.strength)<.01,'light fades on exit')
   await page.emulateMedia({reducedMotion:'reduce'});await canvas.waitFor({state:'detached'})
  }
  assert.deepEqual(errors,[]);console.log('PASS internal light',width);await page.close()
 }
}finally{await browser.close()}
