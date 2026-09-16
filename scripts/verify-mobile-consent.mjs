import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const base = process.env.CONSENT_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost','127.0.0.1','manuelgarciallera.com'].includes(new URL(base).hostname))
await mkdir('.audit/mobile-consent-2026-09-16', { recursive:true })
const browser = await chromium.launch()
try {
  for (const signal of ['normal','dnt','gpc']) {
    const context = await browser.newContext({ viewport:{width:390,height:712}, reducedMotion:'reduce' })
    await context.addInitScript(signal => {
      Object.defineProperty(navigator,'doNotTrack',{get:()=>signal==='dnt'?'1':null})
      Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>signal==='gpc'})
    },signal)
    const page=await context.newPage(), requests=[],errors=[]
    page.on('request',r=>{if(/umami\.is|google-analytics\.com|googletagmanager\.com|\/api\/web-vitals/.test(r.url()))requests.push(r.url())})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(base+'/privacidad',{waitUntil:'domcontentloaded'})
    const reopen=page.getByRole('button',{name:'Preferencias de analítica',exact:true})
    await reopen.waitFor()
    const card=page.getByRole('region',{name:'Tu privacidad, tu elección'})
    if(signal==='normal') {
      await card.waitFor()
      const box=await card.boundingBox()
      assert.ok(box.height<=180,`compact mobile card: ${box.height}`)
      const accept=page.getByRole('button',{name:'Aceptar analítica',exact:true}), reject=page.getByRole('button',{name:'Rechazar analítica',exact:true})
      assert.equal(await accept.isEnabled(),true)
      assert.equal(await accept.evaluate(el=>getComputedStyle(el).color),await reject.evaluate(el=>getComputedStyle(el).color))
      for(const button of [accept,reject]) {const r=await button.boundingBox();assert.ok(r.height>=44&&r.width>=44)}
      await page.screenshot({path:'.audit/mobile-consent-2026-09-16/normal.png'})
      await reject.click()
    } else {
      assert.equal(await card.count(),0,'privacy signals do not trigger an unsolicited banner')
      await reopen.click()
      await card.waitFor()
      assert.equal(await page.getByRole('button',{name:'Aceptar analítica',exact:true}).count(),0)
      await page.getByText('Tu navegador indica «No rastrear»: la analítica permanece apagada.',{exact:true}).waitFor()
      await page.screenshot({path:`.audit/mobile-consent-2026-09-16/${signal}.png`})
      await page.getByRole('button',{name:'Entendido',exact:true}).click()
      assert.equal(await card.count(),0)
      assert.equal(await page.evaluate(()=>localStorage.getItem('portfolio-analytics-consent-v1')),null)
    }
    assert.deepEqual(requests,[]);assert.deepEqual(errors,[])
    console.log('PASS',signal);await context.close()
  }
} finally {await browser.close()}
