// Firefox desktop engine coverage; neither Android emulation nor a phone FPS claim.
import assert from 'node:assert/strict'
import {firefox} from 'playwright'
const base=process.env.HERO_TEST_URL||'https://manuelgarciallera.com'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await firefox.launch()
try{
 const page=await browser.newPage({viewport:{width:390,height:800}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
  localStorage.setItem('rd-theme','dark');window.orbTimes=[]
  const names=new WeakMap(),get=WebGLRenderingContext.prototype.getUniformLocation,set=WebGLRenderingContext.prototype.uniform1f
  WebGLRenderingContext.prototype.getUniformLocation=function(p,n){const l=get.call(this,p,n);if(l)names.set(l,n);return l}
  WebGLRenderingContext.prototype.uniform1f=function(l,v){if(names.get(l)==='time'&&this.canvas.closest('.rd-hero-art'))window.orbTimes.push(v);return set.call(this,l,v)}
 })
 await page.goto(base,{waitUntil:'domcontentloaded'})
 const canvas=page.locator('.rd-hero-canvas')
 await canvas.scrollIntoViewIfNeeded()
 await page.waitForFunction(()=>window.orbTimes.length>4)
 for(const direction of [1,-1]){
  const start=await page.evaluate(()=>({time:window.orbTimes.at(-1),y:scrollY}))
  for(let i=0;i<12;i++){await page.mouse.wheel(0,direction*6);await page.waitForTimeout(60)}
  const after=await page.evaluate(()=>({time:window.orbTimes.at(-1),y:scrollY}))
  assert.ok(Math.abs(after.y-start.y)>20,'wheel really scrolls')
  assert.ok(after.time-start.time>.3,'shader keeps advancing during wheel scroll')
  console.log('PASS Firefox desktop narrow viewport wheel',direction,{advance:after.time-start.time,scroll:after.y-start.y})
 }
 assert.deepEqual(errors,[])
}finally{await browser.close()}
