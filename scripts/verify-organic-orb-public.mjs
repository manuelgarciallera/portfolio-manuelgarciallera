import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
import sharp from 'sharp'
const base=process.env.HERO_TEST_URL||'http://localhost:3015'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/organic-public',{recursive:true})
async function bluePixels(png){const {data}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});let count=0;for(let i=0;i<data.length;i+=3)if(data[i+2]>data[i]+25)count++;return count}
const browser=await chromium.launch()
try{
  for(const width of [390,1280])for(const theme of ['dark','light']){
    const page=await browser.newPage({viewport:{width,height:720}})
    const errors=[];page.on('pageerror',e=>errors.push(e.message))
    await page.addInitScript(theme=>{
      Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});localStorage.setItem('rd-theme',theme)
      window.__heroDraws=0
      const original=WebGLRenderingContext.prototype.drawArrays
      WebGLRenderingContext.prototype.drawArrays=function(...args){if(this.canvas.closest('.rd-hero-art'))window.__heroDraws++;return original.apply(this,args)}
    },theme)
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000})
    const art=page.locator('.rd-hero-art');await art.scrollIntoViewIfNeeded()
    await page.locator('.rd-hero-art[data-ready=true]').waitFor({timeout:60000})
    const stage=page.locator('.rd-hero-canvas-stage')
    assert.ok(await bluePixels(await stage.screenshot())>500,'approved blue liquid replaces the white sphere')
    const canvas=stage.locator('canvas')
    const size=await canvas.evaluate(e=>({width:e.width,height:e.height}))
    assert.ok(Math.max(size.width,size.height)<=(width<768?384:560),'GPU resolution is bounded')
    const first=await stage.screenshot();assert.notDeepEqual(await stage.screenshot(),first,'liquid animates')
    await page.screenshot({path:`.audit/organic-public/${width}-${theme}.png`})
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight))
    await page.waitForTimeout(250) // IntersectionObserver delivery, then measure idle draw count.
    const count=await page.evaluate(()=>window.__heroDraws)
    assert.ok(count>0,'draw instrumentation observed the real hero renderer')
    await page.waitForTimeout(250)
    assert.equal(await page.evaluate(()=>window.__heroDraws),count,'offscreen renderer stops drawing')
    await page.emulateMedia({reducedMotion:'reduce'})
    const fallback=page.locator('.rd-hero-static-orb');await fallback.waitFor();await fallback.scrollIntoViewIfNeeded()
    await fallback.evaluate(e=>e.decode())
    await fallback.screenshot({path:`.audit/organic-public/${width}-${theme}-static.png`})
    assert.ok(await bluePixels(await fallback.screenshot())>200,'reduced motion uses an organic static image')
    assert.equal(await canvas.count(),0,'reduced motion unmounts WebGL')
    if(width===1280&&theme==='dark'){
      await page.emulateMedia({reducedMotion:'no-preference'})
      await canvas.waitFor();await canvas.scrollIntoViewIfNeeded()
      const extension=await canvas.evaluate(e=>{const gl=e.getContext('webgl');const loss=gl.getExtension('WEBGL_lose_context');loss?.loseContext();return !!loss})
      assert.ok(extension,'context loss can be exercised')
      await fallback.waitFor();await fallback.evaluate(e=>e.decode())
      assert.equal(await canvas.count(),0,'context loss replaces WebGL with the static fallback')
    }
    assert.deepEqual(errors,[])
    console.log('PASS organic public',width,theme,'visual, GPU limit, animation, offscreen, static fallback')
    await page.close()
  }
}finally{await browser.close()}
