import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const base=process.env.HERO_TEST_URL||'https://manuelgarciallera.com'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:390,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:3})
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
  localStorage.setItem('rd-theme','dark')
  window.orbSamples=[]
  const names=new WeakMap(),get=WebGLRenderingContext.prototype.getUniformLocation,set=WebGLRenderingContext.prototype.uniform1f
  WebGLRenderingContext.prototype.getUniformLocation=function(p,n){const l=get.call(this,p,n);if(l)names.set(l,n);return l}
  WebGLRenderingContext.prototype.uniform1f=function(l,v){if(names.get(l)==='time'&&this.canvas.closest('.rd-hero-art'))window.orbSamples.push({at:performance.now(),time:v,y:scrollY});return set.call(this,l,v)}
 })
 await page.goto(base,{waitUntil:'domcontentloaded'})
 await page.locator('.rd-hero-canvas').scrollIntoViewIfNeeded()
 await page.waitForFunction(()=>window.orbSamples.length>4)
 const client=await page.context().newCDPSession(page)
 for(const direction of [-1,1]){
  const box=await page.locator('.rd-hero-canvas').boundingBox()
  const x=box.x+box.width/2,y=box.y+box.height/2
  const start=await page.evaluate(()=>({index:window.orbSamples.length,y:scrollY}))
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  for(let i=1;i<=24;i++){
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+direction*i*4}]})
   await page.waitForTimeout(50)
  }
  // Read before lifting the finger: a resumed frame afterwards cannot pass this gate.
  const result=await page.evaluate(start=>({y:scrollY,samples:window.orbSamples.slice(start.index)}),start)
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  assert.ok(Math.abs(result.y-start.y)>20,'native gesture actually scrolls')
  assert.ok(result.samples.length>4,'draws continue before touchEnd')
  assert.ok(result.samples.at(-1).time-result.samples[0].time>.3,'fluid clock progresses during the gesture')
  console.log('PASS native scroll',direction,{draws:result.samples.length,advance:result.samples.at(-1).time-result.samples[0].time,scroll:result.y-start.y})
 }
 // Exercise actual ResizeObserver deliveries while a visible canvas changes size.
 // Mobile browser chrome/layout changes must not repeatedly reset animation time.
 const resizing=await page.evaluate(async()=>{
  const stage=document.querySelector('.rd-hero-canvas-stage'),style=stage.getAttribute('style'),start=window.orbSamples.length
  try{
   for(let i=0;i<30;i++){
    stage.style.width=`${i%2?99:100}%`
    await new Promise(resolve=>requestAnimationFrame(resolve))
   }
   return window.orbSamples.slice(start)
  }finally{if(style===null)stage.removeAttribute('style');else stage.setAttribute('style',style)}
 })
 assert.ok(resizing.length>4,'resize delivers real draws')
 assert.ok(resizing.at(-1).time-resizing[0].time>.3,'repeated size updates must not freeze the fluid clock')
 console.log('PASS continuous resize', {draws:resizing.length,advance:resizing.at(-1).time-resizing[0].time})
 await client.detach()
}finally{await browser.close()}
