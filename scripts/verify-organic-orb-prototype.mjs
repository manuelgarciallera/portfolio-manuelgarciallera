import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {chromium} from 'playwright'

// Local experiment only: never navigates to production or generates analytics.
await mkdir('.audit/organic-orb',{recursive:true})
const browser=await chromium.launch()
try {
  for(const width of [390,900]) {
    const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'})
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(pathToFileURL(resolve('experiments/hero-organic/index.html')).href)
    assert.equal(await page.locator('#status').textContent(),'')
    const canvas=page.locator('canvas')
    const frozen=await canvas.screenshot()
    assert.deepEqual(await canvas.screenshot(),frozen,'reduced motion renders a stable still')
    await page.getByRole('button',{name:'Tema claro'}).click()
    assert.notDeepEqual(await canvas.screenshot(),frozen,'theme changes the actual rendered material')
    await page.screenshot({path:`.audit/organic-orb/${width}-light.png`})
    await page.getByRole('button',{name:'Tema oscuro'}).click()
    await page.getByRole('button',{name:'Reanudar movimiento'}).click()
    const first=await canvas.screenshot()
    // Wait for observable rendering changes, not an arbitrary animation sleep.
    let moved=false
    for(let i=0;i<5;i++){if(!(await canvas.screenshot()).equals(first)){moved=true;break}}
    assert.ok(moved,'flow and rotation animate after opting into motion')
    await page.getByRole('button',{name:'Pausar movimiento'}).click()
    const paused=await canvas.screenshot()
    assert.deepEqual(await canvas.screenshot(),paused,'pause stops the actual rendered motion')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    assert.deepEqual(errors,[])
    await page.screenshot({path:`.audit/organic-orb/${width}-dark.png`})
    console.log('PASS local prototype',width,'shader, themes, reduced motion, play/pause, overflow')
    await page.close()
  }
} finally {await browser.close()}
