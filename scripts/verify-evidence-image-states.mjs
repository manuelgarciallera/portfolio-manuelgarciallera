import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'
const base = process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:3102'
const out = process.env.PUBLIC_TEST_OUTPUT || '.audit/project-images-20260922/image-states'
await fs.mkdir(out, { recursive:true })
const report = { checks:[], failures:[] }
const browser = await chromium.launch()
try {
 for (const width of [1024,1440]) for (const reducedMotion of ['reduce','no-preference']) {
  const page = await browser.newPage({viewport:{width,height:900},reducedMotion})
  await page.goto(`${base}/proyectos/buy-sell-marketplace`,{waitUntil:'networkidle'})
  const states = await page.locator('.rd-case-story__media .rd-project-evidence img').evaluateAll(images => images.map(img => {
   const media=img.closest('.rd-case-story__media'), original=media.className, result=[]
   // Model both real reveal states synchronously, before IntersectionObserver
   // can apply is-in. Capture CSS geometry without timing-dependent waits.
   for (const revealed of [false,true]) {
    media.classList.toggle('is-in',revealed)
    const style=getComputedStyle(img), rect=img.getBoundingClientRect()
    result.push({revealed,transform:style.transform,filter:style.filter,x:rect.x,width:rect.width})
   }
   media.className=original
   return result
  }))
  try {
   assert(states.length>0)
   for(const statesForImage of states)for(const state of statesForImage){
    assert.equal(state.transform,'none','Documentary evidence must not be enlarged/cropped during reveal')
    assert.equal(state.filter,'none','Keep documentary evidence colours authentic')
    assert(state.x>=-1 && state.x+state.width<=width+1,JSON.stringify(state))
   }
   report.checks.push({width,reducedMotion,states})
  }catch(error){report.failures.push({width,reducedMotion,states,error:String(error)})}
  await page.close()
 }
}finally{await browser.close();report.result=report.failures.length?'FAIL':'PASS';await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2))}
console.log(JSON.stringify({result:report.result,passed:report.checks.length,failed:report.failures.length}))
if(report.failures.length)process.exitCode=1
