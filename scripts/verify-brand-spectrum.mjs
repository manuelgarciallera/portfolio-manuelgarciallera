import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

const css = await readFile('src/features/redesign/components/brand-signature.css', 'utf8')
await mkdir('.audit/brand-spectrum', { recursive: true })
const browser = await chromium.launch()
try {
  for (const size of [16, 36]) {
    const page = await browser.newPage({ deviceScaleFactor: 1 })
    await page.setContent(`<style>${css}body{margin:0;background:#0b0d08}.sample{position:relative;width:${size}px;height:${size}px}</style><div class="sample"><span class="rd-brand-m-color"></span></div>`)
    const png = await page.locator('.sample').screenshot({ path: `.audit/brand-spectrum/${size}.png` })
    const {data, info} = await sharp(png).raw().toBuffer({resolveWithObject:true})
    const counts = {cyan:0,blue:0,violet:0,pink:0}
    for(let i=0;i<data.length;i+=info.channels) {
      const [r,g,b] = data.subarray(i,i+3)
      if(r<100&&g>140&&b>160) counts.cyan++
      if(r<130&&g<180&&b>170) counts.blue++
      if(r>=130&&r<200&&g<160&&b>180) counts.violet++
      if(r>=200&&g>70&&b>140&&r>b) counts.pink++
    }
    console.log(size, counts)
    for(const [color,count] of Object.entries(counts)) assert.ok(count>=3, `${size}px must visibly contain ${color}, found ${count} pixels`)
    await page.close()
  }
} finally {await browser.close()}
