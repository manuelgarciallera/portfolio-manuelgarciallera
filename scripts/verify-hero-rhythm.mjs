import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium, firefox } from 'playwright'
const origin = process.argv[2] || 'http://127.0.0.1:3100'
const engine = process.argv[3] === 'firefox' ? firefox : chromium
const motion = process.argv[5] === 'normal' ? 'no-preference' : 'reduce'
const browser = await engine.launch({headless:true})
const observations = []
const failures = []
const output = `.audit/hero-parity-20260923/${process.argv[4] || 'current'}/${engine.name()}`
await fs.mkdir(output, {recursive:true})
try {
  for (const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1366,900]]) {
    const page = await browser.newPage({viewport:{width,height},reducedMotion:motion})
    await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000})
    await page.locator('.rd-hero-copy h1').waitFor()
    await page.evaluate(() => document.fonts.ready)
    const actual = await page.locator('.rd-hero-copy').evaluate(el=>{
      const h1 = el.querySelector('h1')
      const heading=h1.getBoundingClientRect()
      const cta=el.querySelector('a').getBoundingClientRect()
      const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT)
      const lines = new Map()
      while(walker.nextNode()) {
        const node=walker.currentNode
        for(const match of node.textContent.matchAll(/\S+/g)) {
          const range = document.createRange()
          range.setStart(node,match.index); range.setEnd(node,match.index+match[0].length)
          const top=Math.round(range.getBoundingClientRect().top)
          lines.set(top, [...(lines.get(top)||[]),match[0]])
        }
      }
      const css=getComputedStyle(h1)
      return {gap:cta.top-heading.bottom,headingRight:heading.right,headingHeight:heading.height,ctaRight:cta.right,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,lines:[...lines.values()].map(words=>words.join(' ')),fontSize:css.fontSize,fontWeight:css.fontWeight,lineHeight:css.lineHeight,fontFamily:css.fontFamily}
    })
    observations.push({width,height,...actual})
    await page.screenshot({path:`${output}/${width}.png`})
    try {
      if(width<768) {
        assert.ok(actual.gap>=16 && actual.gap<=64, `Uncontrolled mobile title/CTA gap ${actual.gap}px at ${width}`)
        assert.deepEqual(actual.lines,['Diseño','sistemas','digitales que','conectan','investigación,','interfaz y','código.'])
      }
      assert.equal(actual.overflow,false)
      assert.ok(actual.headingRight<=width && actual.ctaRight<=width)
    } catch(error) { failures.push({width,message:error.message}) }
    await page.close()
  }
  console.log(JSON.stringify(observations,null,2))
  await fs.writeFile(`${output}/measurements.json`,JSON.stringify({observations,failures},null,2))
  assert.equal(failures.length,0,JSON.stringify(failures))
} finally { await browser.close() }
