import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'}))
 await page.goto('http://127.0.0.1:3032',{waitUntil:'domcontentloaded'})
 await page.locator('.rd-dual-warm').waitFor({state:'attached',timeout:60000})
 await page.waitForFunction(()=>{const e=document.querySelector('.rd-dual-warm');return e.width===320&&Number(e.dataset.draws)>0})
 await page.evaluate(()=>{const s=document.querySelector('.rd-hero-canvas-stage').getBoundingClientRect();scrollTo(0,scrollY+s.top-250)})
 await page.waitForTimeout(1500)
 const result=await page.locator('.rd-dual-warm').evaluate(e=>{
  const g=e.getContext('webgl'),box=Array.from(g.getParameter(g.SCISSOR_BOX)),enabled=g.isEnabled(g.SCISSOR_TEST)&&box[2]<320
  // Re-render identical uniforms with/without clipping, compare visible pixels.
  g.disable(g.SCISSOR_TEST);g.drawArrays(g.TRIANGLES,0,6)
  const reference=new Uint8Array(320*320*4);g.readPixels(0,0,320,320,g.RGBA,g.UNSIGNED_BYTE,reference)
  g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);g.enable(g.SCISSOR_TEST);g.scissor(...box);g.drawArrays(g.TRIANGLES,0,6)
  const clipped=new Uint8Array(reference.length);g.readPixels(0,0,320,320,g.RGBA,g.UNSIGNED_BYTE,clipped)
  let different=0,opaque=0;for(let y=box[1];y<box[1]+box[3];y++)for(let x=box[0];x<box[0]+box[2];x++)for(let c=0;c<4;c++){const i=(y*320+x)*4+c;if(reference[i]!==clipped[i])different++;if(c===3&&reference[i]>0)opaque++}
  return {enabled,box,different,opaque,error:g.getError(),lost:g.isContextLost()}
 })
 assert.ok(result.enabled,'GPU must skip columns outside viewport')
 assert.equal(result.different,0,'visible pixels must remain identical')
 assert.equal(result.error,0);assert.equal(result.lost,false)
 assert.ok(result.opaque>1000,'compare an actual rendered orb, not empty buffers')
 console.log('PASS',result)
}finally{await browser.close()}
