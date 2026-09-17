import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {chromium} from 'playwright'
const css=await readFile('src/features/redesign/redesign.css','utf8')
const browser=await chromium.launch()
try{
 for(const width of [390,767,768,1280])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:900}})
  if(process.env.HERO_TEST_URL){
   await page.addInitScript(theme=>{localStorage.setItem('rd-theme',theme);Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'})},theme)
   await page.goto(process.env.HERO_TEST_URL,{waitUntil:'domcontentloaded'})
   await page.locator('.rd-hero-copy h1').waitFor()
  }else{
   await page.setContent(`<html data-theme="${theme}"><body><main class="rd-root"><div class="rd-hero-copy"><h1>Diseño sistemas digitales que conectan investigación, interfaz y código.</h1></div></main></body></html>`)
   await page.addStyleTag({content:css})
  }
  const title=page.locator('h1')
  const sample=time=>title.evaluate((el,time)=>{const a=el.getAnimations()[0];a.pause();a.currentTime=time;return {position:parseFloat(getComputedStyle(el).backgroundPositionX),duration:a.effect.getTiming().duration}},time)
  const desktop=width>=768
  assert.equal((await sample(0)).duration,desktop?10000:18000)
  assert.ok((await sample(desktop?3900:3500)).position>0,'sweep still moving near end')
  assert.equal((await sample(desktop?4000:3600)).position,0,'sweep completes on time')
  assert.equal((await sample(desktop?9900:17900)).position,0,'quiet pause before next pass')
  assert.equal((await sample(desktop?10500:18500)).position,(await sample(500)).position,'next cycle repeats')
  await page.emulateMedia({reducedMotion:'reduce'})
  assert.equal(await title.evaluate(e=>getComputedStyle(e).animationName),'none')
  console.log('PASS desktop4+6/mobile unchanged/reduced',width,theme)
  await page.close()
 }
}finally{await browser.close()}
