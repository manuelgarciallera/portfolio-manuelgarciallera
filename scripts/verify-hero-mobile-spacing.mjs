import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
const base=process.env.HERO_TEST_URL||'http://localhost:3015'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/hero-mobile-spacing',{recursive:true})
const browser=await chromium.launch()
try {
 for(const width of [320,390,430,767]) {
  const page=await browser.newPage({viewport:{width,height:800},reducedMotion:'reduce'})
  await page.addInitScript(()=>{Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});localStorage.setItem('rd-theme','dark')})
  await page.goto(base,{waitUntil:'domcontentloaded'})
  await page.evaluate(()=>document.fonts.ready)
  const measure=()=>page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{y:r.top+scrollY,bottom:r.bottom+scrollY,width:r.width}}
   const n=document.querySelector('.rd-hero-name'),range=document.createRange();range.selectNodeContents(n)
   const next=document.querySelector('.rd-hero').nextElementSibling
   return{orb:rect('.rd-hero-canvas-stage'),name:rect('.rd-hero-name'),hero:rect('.rd-hero'),cta:rect('.rd-hero-copy a'),title:rect('h1'),font:parseFloat(getComputedStyle(n).fontSize),nextHeight:next.getBoundingClientRect().height,text:range.getBoundingClientRect().width,lines:new Set([...n.children].map(e=>e.getBoundingClientRect().top)).size,overflow:document.documentElement.scrollWidth>innerWidth}
  })
  // Previous accepted layout, on the same page/fonts/viewport: detects regressions
  // in position, remaining black space, wrapping and unrelated hero geometry.
  const after=await measure()
  await page.locator('.rd-hero-name').scrollIntoViewIfNeeded()
  await page.screenshot({path:`.audit/hero-mobile-spacing/${width}.png`})
  const previousFont=Math.min(32,Math.max(16,width*.067))
  const old=await page.addStyleTag({content:`.rd-hero-art{padding-bottom:40px!important;transition:none!important}.rd-hero-name{font-size:${previousFont}px!important;line-height:1.25!important;transition:none!important}.rd-hero-name span:first-child{display:inline!important}`})
  await page.waitForFunction(size=>{const n=document.querySelector('.rd-hero-name');return Math.abs(n.getBoundingClientRect().height-size*1.25)<1&&parseFloat(getComputedStyle(document.querySelector('.rd-hero-art')).paddingBottom)===40},previousFont)
  const before=await measure();await old.evaluate(e=>e.remove())
  console.log('comparison',width,{before,after})
  assert.deepEqual(after.orb,before.orb,'orb stays in its approved position')
  assert.ok(after.font>before.font*1.2,'identity type is visibly larger')
  assert.equal(after.lines,2);assert.ok(after.text<=after.name.width+1);assert.equal(after.overflow,false)
  assert.ok(after.hero.bottom>=before.hero.bottom+80,'black hero genuinely extends rather than painting over following content')
  assert.equal(after.nextHeight,before.nextHeight,'following section retains its full height')
  assert.ok(after.hero.bottom-after.name.bottom>=before.hero.bottom-before.name.bottom+60,'extra black space remains below identity')
  assert.deepEqual(after.cta,before.cta);assert.deepEqual(after.title,before.title)
  console.log('PASS mobile spacing',width,after)
  await page.close()
 }
}finally{await browser.close()}
