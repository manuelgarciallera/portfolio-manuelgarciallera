// Diagnostic A/B only: software Chromium timing is not phone FPS or battery use.
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const base=process.env.HERO_TEST_URL||'https://manuelgarciallera.com'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
const browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:390,height:800},hasTouch:true})
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})
  localStorage.setItem('rd-theme','dark')
  window.skipOrb=false;window.orbDraws=0
  const draw=WebGLRenderingContext.prototype.drawArrays
  WebGLRenderingContext.prototype.drawArrays=function(...args){
   if(this.canvas.closest('.rd-hero-art')){if(window.skipOrb)return;window.orbDraws++}
   return draw.apply(this,args)
  }
 })
 await page.goto(base,{waitUntil:'domcontentloaded'})
 await page.locator('.rd-hero-canvas-stage').scrollIntoViewIfNeeded()
 await page.waitForFunction(()=>window.orbDraws>5)
 const gpu=await page.locator('canvas.rd-hero-canvas').evaluate(e=>{
  const gl=e.getContext('webgl'),ext=gl.getExtension('WEBGL_debug_renderer_info')
  return{width:e.width,height:e.height,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'}
 })
 const results=[]
 for(const skip of [false,true,false]){
  results.push(await page.evaluate(async skip=>{
   window.skipOrb=skip
   await new Promise(r=>setTimeout(r,300))
   const frames=[],start=performance.now(),draws=window.orbDraws
   let previous=start
   await new Promise(resolve=>{
    function tick(now){frames.push(now-previous);previous=now;if(now-start<2500)requestAnimationFrame(tick);else resolve()}
    requestAnimationFrame(tick)
   })
   frames.sort((a,b)=>a-b)
   return{skipOrb:skip,samples:frames.length,median:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],over33ms:frames.filter(n=>n>33.4).length,draws:window.orbDraws-draws}
  },skip))
 }
 console.log(JSON.stringify({url:base,gpu,results,limitation:'RAF intervals in this browser only; not physical mobile scroll FPS. A/B skips only orb GPU draws and restores them.'},null,2))
}finally{await browser.close()}
