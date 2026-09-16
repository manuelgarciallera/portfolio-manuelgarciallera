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
   return{orb:rect('.rd-hero-canvas-stage'),name:rect('.rd-hero-name'),hero:rect('.rd-hero'),cta:rect('.rd-hero-copy a'),title:rect('h1'),text:range.getBoundingClientRect().width,lines:new Set([...n.children].map(e=>e.getBoundingClientRect().top)).size,overflow:document.documentElement.scrollWidth>innerWidth}
  })
  // Previous accepted layout, on the same page/fonts/viewport: detects regressions
  // in position, remaining black space, wrapping and unrelated hero geometry.
  const after=await measure()
  await page.locator('.rd-hero-name').scrollIntoViewIfNeeded()
  await page.screenshot({path:`.audit/hero-mobile-spacing/${width}.png`})
  const old=await page.addStyleTag({content:'.rd-hero-art{transform:none!important}.rd-hero-name{font-size:clamp(1rem,6cqi,1.75rem)!important}'})
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  const before=await measure();await old.evaluate(e=>e.remove())
  console.log('comparison',width,{before,after})
  assert.ok(after.orb.y<=before.orb.y-20,'orb is visibly higher')
  assert.ok(after.name.y<=before.name.y-20,'name moves up with orb')
  assert.ok(after.text>before.text*1.08,'name extends further towards the margins')
  assert.equal(after.lines,1);assert.ok(after.text<=after.name.width);assert.equal(after.overflow,false)
  assert.ok(after.hero.bottom>=before.hero.bottom-1,'section does not collapse upward')
  assert.ok(after.hero.bottom-after.name.bottom>=before.hero.bottom-before.name.bottom+20,'extra black space remains below identity')
  assert.deepEqual(after.cta,before.cta);assert.deepEqual(after.title,before.title)
  console.log('PASS mobile spacing',width,after)
  await page.close()
 }
}finally{await browser.close()}
