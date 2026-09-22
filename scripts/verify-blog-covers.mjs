import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'

const base=process.env.HERO_TEST_URL||'http://127.0.0.1:3036'
const browser=await chromium.launch()
await mkdir('.audit/blog-covers',{recursive:true})
try {
  for(const width of [390,768,1280]) {
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'})
    const errors=[];page.on('pageerror',error=>errors.push(error.message))
    await page.goto(`${base}/blog`,{waitUntil:'networkidle'})
    assert.equal(await page.locator('.rd-editorial__grid article').count(),4)
    assert.equal(await page.locator('.rd-editorial__rail').count(),0)
    const cover=page.locator('.rd-editorial__grid .rd-article-cover').first()
    await cover.scrollIntoViewIfNeeded()
    const box=await cover.boundingBox()
    assert.ok(box.height>=320)
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
    const heading=await page.locator('.rd-editorial__grid h3').first().boundingBox()
    if(width<=760) assert.ok(heading.y>=box.y+box.height)
    else assert.ok(heading.x>=box.x+box.width)
    await page.screenshot({path:`.audit/blog-covers/blog-${width}.png`})
    await page.locator('.rd-editorial__grid a').first().focus()
    assert.equal(await page.locator('.rd-editorial__grid a').first().evaluate(el=>getComputedStyle(el).outlineStyle),'solid')
    await page.goto(base,{waitUntil:'networkidle'})
    const rail=page.locator('.rd-editorial__rail')
    await rail.scrollIntoViewIfNeeded()
    assert.equal(await rail.locator('article').count(),4)
    assert.equal(await page.locator('[aria-controls="articles-track"]').count(),2)
    assert.ok(await rail.evaluate(el=>el.scrollWidth>el.clientWidth))
    assert.equal(await page.locator('.rd-dual-warm').count(),0)
    await page.screenshot({path:`.audit/blog-covers/home-${width}.png`})
    assert.deepEqual(errors,[])
    await page.close()
  }
  const page=await browser.newPage()
  assert.equal((await page.request.get(`${base}/lab/orbes`)).status(),404)
  console.log('PASS blog large covers, mobile stacking, tablet/desktop columns, no overflow, keyboard, landing rail retained, yellow trial absent')
} finally {await browser.close()}
