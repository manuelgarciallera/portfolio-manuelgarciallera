import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
await mkdir('.audit/orange-bubbles',{recursive:true})
const browser=await chromium.launch()
const pixels=page=>page.locator('#orange-bubbles-lab').evaluate(c=>{
 const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data
 let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>15)count++
 return count
})
try{
 for(const [width,motion] of [[1280,'no-preference'],[390,'no-preference'],[1280,'reduce']]){
  const page=await browser.newPage({viewport:{width,height:800},reducedMotion:motion})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});localStorage.setItem('rd-theme','dark')})
  await page.goto('http://127.0.0.1:3031',{waitUntil:'domcontentloaded'})
  const demo=page.getByRole('button',{name:'Ver un gesto de ejemplo'})
  await demo.waitFor();await page.evaluate(()=>document.fonts.ready)
  assert.equal(await page.locator('#orange-bubbles-lab').evaluate(e=>getComputedStyle(e).pointerEvents),'none')
  if(width<768||motion==='reduce'){
   assert.equal(await demo.isDisabled(),true);assert.equal(await pixels(page),0)
  }else{
   await page.locator('.rd-hero-art[data-ready=true]').waitFor({timeout:60000})
   await demo.click();await page.waitForTimeout(180)
   assert.ok(await pixels(page)>40,'demo produces visible orange bubbles')
   await page.screenshot({path:'.audit/orange-bubbles/dark.png'})
   await page.waitForTimeout(2800);assert.equal(await pixels(page),0,'particles fully dissolve')
   const r=await page.locator('.rd-hero-canvas-stage').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2
   await page.evaluate(()=>{window.pointerSamples=[];window.bubbleArcs=[];const arc=CanvasRenderingContext2D.prototype.arc;CanvasRenderingContext2D.prototype.arc=function(...args){if(this.canvas.id==='orange-bubbles-lab')window.bubbleArcs.push({x:args[0],at:performance.now()});return arc.apply(this,args)};addEventListener('pointermove',e=>window.pointerSamples.push({x:e.clientX,y:e.clientY,at:performance.now(),stamp:e.timeStamp,type:e.pointerType}))})
   await page.mouse.move(x+110,y);await page.waitForTimeout(15);await page.mouse.move(x-100,y-10)
   await page.waitForTimeout(100);console.log('Pointer samples',await page.evaluate(()=>({events:window.pointerSamples,arcs:window.bubbleArcs.slice(0,8),now:performance.now()})),r);assert.ok(await pixels(page)>40,'real fast pointer gesture emits particles')
   await page.screenshot({path:'.audit/orange-bubbles/gesture.png'})
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);assert.equal(await pixels(page),0,'changing motion preference clears active particles')
  }
  assert.deepEqual(errors,[]);console.log('PASS lab',width,motion);await page.close()
 }
}finally{await browser.close()}
