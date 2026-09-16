import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

const base = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1', 'manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/desktop-orb-scale', { recursive:true })
const browser = await chromium.launch()
try {
  for (const [width,height] of [[390,712],[768,600],[1024,768],[1280,720],[1366,768],[1920,1080]]) {
    const page = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'})
    await page.addInitScript(() => { Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'}); localStorage.setItem('rd-theme','dark') })
    await page.goto(base,{waitUntil:'domcontentloaded'})
    await page.locator('.rd-hero-static-orb').waitFor()
    await page.locator('.rd-hero-static-orb').evaluate(e=>e.decode())
    await page.evaluate(() => document.fonts.ready)
    const m = await page.evaluate(() => {
      const box = s => { const e=document.querySelector(s),r=e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,font:parseFloat(getComputedStyle(e).fontSize)} }
      return {hero:box('.rd-hero'),title:box('.rd-hero-copy h1'),art:box('.rd-hero-art'),orb:box('.rd-hero-static-orb'),name:box('.rd-hero-name'),cta:box('.rd-hero-copy a'),
        lines:[...document.querySelectorAll('.rd-hero-name span')].map(e=>e.getBoundingClientRect().top),overflow:document.documentElement.scrollWidth>innerWidth}
    })
    console.log(width,height,m)
    assert.equal(m.overflow,false)
    if(width>=768) {
      // The PNG now includes transparent space for droplets: measure painted pixels,
      // not the image element's surrounding box.
      const {data,info}=await sharp(await page.locator('.rd-hero-static-orb').screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true})
      let left=info.width,right=0
      for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*3;if(data[i+2]>data[i]+25){left=Math.min(left,x);right=Math.max(right,x)}}
      const diameter=(right-left)/m.title.font
      assert.ok(diameter>=2.7 && diameter<=3.8,'organic silhouette follows roughly three H1 lines')
      assert.ok(m.name.y>=m.orb.bottom,'name below sphere')
      assert.ok(m.name.bottom<=height && m.cta.bottom<height,'identity and CTA stay inside viewport')
      assert.ok(Math.abs(m.hero.bottom-height)<=1,'desktop section remains one viewport')
      assert.equal(new Set(m.lines).size,width>=1180?1:3,'name changes composition at narrow desktop')
    } else {
      assert.ok(m.art.y>=650&&m.art.y<688,'mobile identity is raised further without moving the CTA')
      assert.equal(new Set(m.lines).size,1,'mobile identity is one line under the enlarged orb')
      assert.ok(m.name.y>=m.orb.bottom-20,'mobile name uses the transparent bottom margin without crossing the liquid')
    }
    await page.screenshot({path:`.audit/desktop-orb-scale/${width}.png`})
    await page.close()
  }
} finally {await browser.close()}
