import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
import sharp from 'sharp'
const base=process.env.HERO_TEST_URL||'http://localhost:3015'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/mobile-hero-polish',{recursive:true})
const browser=await chromium.launch()
const failures=[]
try{
 for(const [width,theme] of [[320,'dark'],[390,'dark'],[430,'dark'],[390,'light']]){
  const page=await browser.newPage({viewport:{width,height:800},hasTouch:true,reducedMotion:'reduce'})
  await page.addInitScript(theme=>{Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});localStorage.setItem('rd-theme',theme);window.orbDraws=0;const draw=WebGLRenderingContext.prototype.drawArrays;WebGLRenderingContext.prototype.drawArrays=function(...args){if(this.canvas.closest('.rd-hero-art'))window.orbDraws++;return draw.apply(this,args)}},theme)
  await page.goto(base,{waitUntil:'domcontentloaded'})
  const name=page.locator('.rd-hero-name'),art=page.locator('.rd-hero-art')
  await art.scrollIntoViewIfNeeded()
  await page.locator('.rd-hero-static-orb').evaluate(e=>e.decode())
  try{
   const geometry=await name.evaluate(e=>{const r=e.getBoundingClientRect();return{tops:[...e.children].map(s=>s.getBoundingClientRect().top),width:r.width,scroll:e.scrollWidth,top:r.top}})
   assert.equal(new Set(geometry.tops).size,1,'mobile name must occupy one line')
   assert.ok(geometry.scroll<=geometry.width+1,'name fits without clipping')
   const {data,info}=await sharp(await page.locator('.rd-hero-static-orb').screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true})
   let lo=info.width,hi=0,bottom=0
   for(let i=0;i<data.length;i+=3)if(data[i+2]>data[i]+25){const x=(i/3)%info.width;lo=Math.min(lo,x);hi=Math.max(hi,x);bottom=Math.max(bottom,Math.floor(i/3/info.width))}
   assert.ok(hi-lo>width*.60,'organic envelope is visibly larger than the previous small mobile orb')
   assert.ok(hi-lo<width*.94,'droplets retain side clearance')
   const visibleBottom=(await page.locator('.rd-hero-static-orb').boundingBox()).y+bottom
   assert.ok(geometry.top>=visibleBottom+4,'name clears the visible liquid and droplets')
   assert.ok(geometry.top-visibleBottom<60,'name is close to the orb, not separated by a large empty area')
   assert.ok(await name.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=width*.059,'mobile identity has the requested larger type')
   console.log('PASS mobile layout',width)
  }catch(e){failures.push(`${width} layout: ${e.message}`)}
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.waitForFunction(()=>document.querySelector('.rd-hero-art').dataset.ready==='true')
  try{
   const animation=await name.evaluate(e=>{const a=e.getAnimations()[0];return a?.effect.getTiming().duration})
   assert.equal(animation,4500,'name blue sweep repeats every4.5s')
   await name.evaluate(e=>{const a=e.getAnimations()[0];a.pause();a.currentTime=0})
   const plain=await name.screenshot()
   await name.evaluate(e=>{e.getAnimations()[0].currentTime=1200})
   assert.notDeepEqual(await name.screenshot(),plain,'name visibly receives blue pigment')
   await page.screenshot({path:`.audit/mobile-hero-polish/${width}-${theme}.png`})
   await name.evaluate(e=>{e.getAnimations()[0].currentTime=3000})
   assert.deepEqual(await name.screenshot(),plain,'name returns to its plain theme color')
   const h1=await page.locator('h1').evaluate(e=>{const a=e.getAnimations()[0];a.pause();a.currentTime=0;const first=getComputedStyle(e).backgroundPosition;a.currentTime=3600;return{first,last:getComputedStyle(e).backgroundPosition}})
   assert.equal(h1.first,'100% 100%','mobile sweep starts before top-left edge')
   assert.ok(h1.last.split(' ').every(v=>parseFloat(v)===0),'mobile sweep ends past bottom-right edge')
   console.log('PASS mobile sweeps',width)
  }catch(e){failures.push(`${width} sweeps: ${e.message}`)}
  try{
   await page.evaluate(()=>window.dispatchEvent(new Event('touchstart')))
   const before=await page.evaluate(()=>window.orbDraws)
   await page.waitForTimeout(350)
   assert.ok(await page.evaluate(()=>window.orbDraws)>before,'a stationary touch does not freeze the orb')
   await page.evaluate(()=>window.dispatchEvent(new Event('touchend')))
   const inertia=await page.evaluate(async()=>{
    const start=scrollY,before=window.orbDraws
    for(let i=0;i<6;i++){window.scrollBy({top:4,behavior:'instant'});await new Promise(r=>setTimeout(r,60))}
    return{before,after:window.orbDraws,moved:scrollY!==start}
   })
   assert.ok(inertia.moved,'actual scroll position changes during the test')
   assert.ok(inertia.after>inertia.before,'orb continues animating during scrolling')
   await page.waitForFunction(n=>window.orbDraws>n,inertia.after)
   console.log('PASS continuous touch and scroll animation',width)
  }catch(e){failures.push(`${width} scroll: ${e.message}`)}
  await page.close()
 }
}finally{await browser.close()}
assert.deepEqual(failures,[])
