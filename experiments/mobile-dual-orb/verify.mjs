import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
await mkdir('.audit/mobile-dual-orb',{recursive:true})
const browser=await chromium.launch()
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}})
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)})
  await page.addInitScript(()=>{Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});localStorage.setItem('rd-theme','dark')})
  await page.goto('http://127.0.0.1:3032',{waitUntil:'domcontentloaded'})
  await page.locator('.rd-hero-art[data-ready=true]').waitFor({state:'attached',timeout:60000})
  const warm=page.locator('.rd-dual-warm')
  await warm.waitFor({state:'attached'})
  console.log('layout',await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,hero:document.querySelector('.rd-hero').getBoundingClientRect().toJSON(),position:getComputedStyle(document.querySelector('.rd-hero')).position,overflow:getComputedStyle(document.querySelector('.rd-hero')).overflow})))
  await page.screenshot({path:`.audit/mobile-dual-orb/debug-${width}.png`})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  if(width===390){
   await page.evaluate(()=>{const s=document.querySelector('.rd-hero-canvas-stage').getBoundingClientRect();scrollTo(0,scrollY+s.top-330)})
   await page.waitForTimeout(1200)
   assert.ok(await warm.isVisible());assert.equal(await warm.evaluate(e=>getComputedStyle(e).pointerEvents),'none')
   const b=await page.locator('.rd-hero-canvas-stage').boundingBox(),w=await warm.boundingBox()
   assert.ok(w.width>b.width*1.5&&w.y<b.y&&w.x>b.x)
   await page.screenshot({path:'.audit/mobile-dual-orb/two.png'})
   const first=Number(await warm.getAttribute('data-draws'));await page.waitForTimeout(400);assert.ok(Number(await warm.getAttribute('data-draws'))>first)
   await page.getByRole('button',{name:'Comparar: solo azul'}).click()
   assert.equal(await warm.isVisible(),false)
   await page.screenshot({path:'.audit/mobile-dual-orb/blue.png'})
   await page.getByRole('button',{name:'Comparar: dos orbes'}).click()
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300)
   const stopped=await warm.getAttribute('data-draws');await page.waitForTimeout(300);assert.equal(await warm.getAttribute('data-draws'),stopped)
  }else assert.equal(await warm.isVisible(),false)
  assert.deepEqual(errors,[]);console.log('PASS composition, comparison, reduced motion, desktop exclusion',width);await page.close()
 }
}finally{await browser.close()}
