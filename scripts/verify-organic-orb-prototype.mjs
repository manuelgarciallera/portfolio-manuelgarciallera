import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {chromium} from 'playwright'
import sharp from 'sharp'

async function particleCount(png) {
  const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true})
  const mask=new Uint8Array(info.width*info.height)
  for(let i=0;i<mask.length;i++) mask[i]=Number(data[i*3+2]>data[i*3]+20)
  let droplets=0
  for(let i=0;i<mask.length;i++) {
    if(!mask[i])continue
    const queue=[i];mask[i]=0;let area=0
    for(let j=0;j<queue.length;j++) {
      const p=queue[j];area++
      const x=p%info.width
      for(const n of [x>0?p-1:-1,x<info.width-1?p+1:-1,p-info.width,p+info.width]) {
        if(n>=0&&n<mask.length&&mask[n]){mask[n]=0;queue.push(n)}
      }
    }
    if(area>=3&&area<200)droplets++
  }
  return droplets
}

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
    assert.ok(await particleCount(frozen)>=2,'small detached droplets are actually visible outside the liquid body')
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
