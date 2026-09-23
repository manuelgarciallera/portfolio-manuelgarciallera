import { build } from 'esbuild'
import { chromium, firefox } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

// Real public components in a disposable fixture; no production data or services.
const built = await build({
  plugins: process.argv.includes('--baseline') ? [{name:'original-media',setup(builder) {
    builder.onLoad({filter:/[\\/]src[\\/]features[\\/]redesign[\\/](case[\\/](ProjectEvidenceImage|CaseVisualJourney)|components[\\/]ProjectPreviewCarousel)\.tsx$/}, args => ({
      contents:execFileSync('git',['show',`HEAD:${path.relative(process.cwd(),args.path).replaceAll('\\','/')}`],{encoding:'utf8'}),loader:'tsx',
    }))
  }}] : [],
  stdin: { contents: `
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { ImageConfigContext } from 'next/dist/shared/lib/image-config-context.shared-runtime';
    import { imageConfigDefault } from 'next/dist/shared/lib/image-config';
    import { ProjectEvidenceImage } from './src/features/redesign/case/ProjectEvidenceImage';
    import { ProjectPreviewCarousel } from './src/features/redesign/components/ProjectPreviewCarousel';
    import { CaseVisualJourney } from './src/features/redesign/case/CaseVisualJourney';
    import './src/features/redesign/redesign.css';
    const slides = [{src:'/projects/nude-project/mobile-home.webp',alt:'Pantalla de prueba',label:'Primera',fit:'contain'},
      {src:'/projects/nude-project/mobile-bag.webp',alt:'Otra pantalla',label:'Segunda',fit:'contain'},
      {src:'/projects/theuxunion/mobile-discover-figma-hd.webp',alt:'Descubrir',label:'Mobile · Descubrir',fit:'contain'},
      {src:'/projects/theuxunion/mobile-nodes-figma-hd.webp',alt:'Nodos',label:'Mobile · Nodos',fit:'contain'},
      {src:'/projects/theuxunion/design-system-foundations-figma-hd.webp',alt:'Identidad',label:'Sistema · Identidad'},
      {src:'/projects/theuxunion/design-system-components-figma-hd.webp',alt:'Componentes',label:'Sistema · Componentes'}];
    function Fixture() {
      const [mounted,setMounted] = useState(true); window.unmountEvidence = () => setMounted(false);
      return <ImageConfigContext.Provider value={{...imageConfigDefault,qualities:[75,92]}}><div className="rd-root">
        <div style={{height:'80vh'}}/><a href="#after">Antes</a>
        {mounted && <ProjectEvidenceImage src={slides[0].src} alt="Pantalla de prueba" sizes="320px"/>}
        <a id="after" href="#">Después</a>
        <section className="rd-section"><article className="rd-case"><div className="rd-case-visual rd-case-visual--nude-project" data-engaged="true" style={{height:'40rem'}}>
          <ProjectPreviewCarousel label="Prueba de tarjeta" slides={slides} engaged cover={<div className="rd-project-cover">Portada</div>}/>
        </div></article></section>
        <CaseVisualJourney study={{slug:'nude-project',title:'NudeProject',tags:'Diseño',claim:'Prueba',visual:{theme:'nude-project',slides}}}/>
        <div style={{height:'100vh'}}/>
      </div></ImageConfigContext.Provider>
    }
    createRoot(document.getElementById('root')).render(<Fixture/>);
  `, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, outdir: 'out',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
})
const js = built.outputFiles.find(file => file.path.endsWith('.js')).text
const css = built.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? ''
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1')
  if (url.pathname === '/app.js') { response.setHeader('content-type','text/javascript'); response.end(js); return }
  if (url.pathname === '/app.css') { response.setHeader('content-type','text/css'); response.end(css); return }
  const asset = url.pathname === '/_next/image' ? url.searchParams.get('url') : url.pathname
  if (asset?.startsWith('/projects/')) {
    try { response.setHeader('content-type','image/webp'); response.end(await readFile(path.join(process.cwd(),'public',asset))); return }
    catch { response.statusCode = 404; response.end(); return }
  }
  response.setHeader('content-type','text/html; charset=utf-8')
  response.end('<!doctype html><html lang="es" data-theme="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font:16px system-ui}.rd-root{--font-serif:Georgia,serif} .rd-project-evidence{max-width:320px} </style><div id="root"></div><script src="/app.js"></script></html>')
})
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve))
const base = `http://127.0.0.1:${server.address().port}`
const engine = process.argv.includes('--firefox') ? 'firefox' : 'chromium'
const browser = await (engine === 'firefox' ? firefox : chromium).launch({headless:true})
const results = []
async function check(name, options, action) {
  const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7)
  if (only && name !== only) return
  const profile = {viewport:{width:390,height:844},...options}
  if (engine === 'firefox') delete profile.isMobile
  const context = await browser.newContext(profile)
  const page = await context.newPage(); const errors = []
  page.on('pageerror',error => errors.push(error.message))
  page.setDefaultTimeout(3500)
  try { await page.goto(base,{waitUntil:'domcontentloaded',timeout:15000}); await page.locator('.rd-preview-carousel').waitFor({timeout:15000}); await action(page); assert.deepEqual(errors,[]); results.push({name,status:'PASS'}) }
  catch(error) { results.push({name,status:'FAIL',reason:error.message,errors,geometry:await page.locator('.rd-preview-controls').first().evaluate(element => ({controls:element.getBoundingClientRect().toJSON(),viewport:[innerWidth,innerHeight],scroll:scrollY})).catch(() => null)}) }
  finally { await context.close() }
  console.log(JSON.stringify({engine,...results.at(-1)}))
}
try {
  for (const width of [320,390,768,1440]) await check(`lightbox-${width}`,{viewport:{width,height:844}},async page => {
    const trigger = page.getByRole('button',{name:'Ampliar imagen: Pantalla de prueba',exact:true}).first()
    await trigger.scrollIntoViewIfNeeded(); await trigger.focus()
    const before = await page.evaluate(() => scrollY)
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog'); await dialog.waitFor()
    const close = dialog.getByRole('button',{name:'Cerrar imagen ampliada'})
    const box = await close.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44,'44px close target')
    assert.equal(await close.evaluate(element => element === document.activeElement),true,'initial close focus')
    for (const key of ['Shift+Tab','Shift+Tab','Tab','Tab','Tab']) {
      await page.keyboard.press(key)
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)),true,`${key} focus contained at both boundaries`)
    }
    const image = dialog.locator('img'); const imageBox = await image.boundingBox()
    assert.ok(imageBox.x >= 0 && imageBox.y >= 0 && imageBox.x + imageBox.width <= width + 1 && imageBox.y + imageBox.height <= 845,'image bounded')
    await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'})
    assert.equal(await trigger.evaluate(element => element === document.activeElement),true,'focus restored')
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - before) <= 1,'scroll restored')
    await trigger.click(); await dialog.waitFor(); await close.click(); await dialog.waitFor({state:'detached'})
    await trigger.click(); await dialog.waitFor(); await page.mouse.click(2,2); await dialog.waitFor({state:'detached'})
    await trigger.click(); await dialog.waitFor(); await page.evaluate(() => window.unmountEvidence()); await dialog.waitFor({state:'detached'})
    assert.notEqual(await page.evaluate(() => document.body.style.position),'fixed','body unlocks on unmount')
  })
  await check('mobile-pause',{hasTouch:true,isMobile:true},async page => {
    const carousel = page.getByRole('region',{name:'Prueba de tarjeta'})
    await carousel.scrollIntoViewIfNeeded()
    const pause = carousel.getByRole('button',{name:'Pausar secuencia'}); await pause.click()
    await carousel.getByRole('button',{name:'Reanudar secuencia'}).waitFor()
    const state = await carousel.getAttribute('data-frame')
    await page.waitForTimeout(4500)
    assert.equal(await carousel.getAttribute('data-frame'),state,'pause holds frame')
  })
  await check('reduced-manual-controls',{viewport:{width:1440,height:900},reducedMotion:'reduce'},async page => {
    const carousel = page.getByRole('region',{name:'Prueba de tarjeta'})
    await carousel.scrollIntoViewIfNeeded()
    await carousel.getByRole('button',{name:'Vista siguiente'}).click()
    assert.equal(await carousel.getAttribute('data-frame'),'slide')
    assert.equal(await carousel.locator('[aria-current="true"]').textContent(),'Primera')
  })
  await check('desktop-view-selector',{viewport:{width:1440,height:900},reducedMotion:'reduce'},async page => {
    const tabs = page.getByRole('region',{name:'Prueba de tarjeta'}).getByRole('group',{name:'Seleccionar vista'})
    await tabs.scrollIntoViewIfNeeded()
    for (const name of ['Primera','Sistema · Componentes','Mobile · Nodos']) {
      const button=tabs.getByRole('button',{name,exact:true}); await button.click()
      const area=await tabs.boundingBox(), box=await button.boundingBox()
      assert.ok(box.x>=area.x-1 && box.x+box.width<=area.x+area.width+1,'selected view stays inside its own selector')
      assert.equal(await button.getAttribute('aria-current'),'true')
    }
  })
  await check('project-title-band',{viewport:{width:1440,height:900}},async page => {
    const rail = page.locator('[data-journey-title="NudeProject"]'); await rail.scrollIntoViewIfNeeded()
    assert.ok((await rail.textContent()).includes('NudeProject'))
    const box = await rail.boundingBox(); await page.mouse.move(box.x + box.width * .98,box.y + box.height / 2)
    const before = await rail.locator('[data-title-track]').evaluate(element => getComputedStyle(element).transform)
    await page.waitForTimeout(250)
    const after = await rail.locator('[data-title-track]').evaluate(element => getComputedStyle(element).transform)
    assert.notEqual(after,before,'desktop edge moves title band')
    await page.mouse.move(box.x + box.width * .5,box.y + box.height / 2)
    const offset = await rail.locator('[data-title-track]').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
    await page.mouse.down(); await page.mouse.move(box.x + box.width * .5 - 100,box.y + box.height / 2,{steps:5})
    const dragged = await rail.locator('[data-title-track]').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
    assert.ok(Math.abs(dragged - offset) >= 90,'mouse dragging moves title band')
    assert.equal(await rail.getAttribute('data-interacting'),'true','localized text tint responds')
    await page.mouse.up()
    const pause = rail.getByRole('button',{name:'Pausar movimiento del nombre del proyecto'})
    await pause.focus(); await page.keyboard.press('Enter')
    assert.equal(await rail.getByRole('button',{name:'Reanudar movimiento del nombre del proyecto'}).getAttribute('aria-pressed'),'true')
  })
  await check('reduced-title-band',{viewport:{width:1440,height:900},reducedMotion:'reduce'},async page => {
    const rail = page.locator('[data-journey-title="NudeProject"]'); await rail.scrollIntoViewIfNeeded()
    const track = rail.locator('[data-title-track]'); const before = await track.evaluate(element => getComputedStyle(element).transform)
    const box = await rail.boundingBox(); await page.mouse.move(box.x + box.width * .98,box.y + box.height / 2)
    await page.waitForTimeout(300)
    assert.equal(await track.evaluate(element => getComputedStyle(element).transform),before,'reduced motion blocks autonomous edge movement')
  })
  if (engine === 'chromium') await check('native-touch-title-band',{hasTouch:true,isMobile:true,reducedMotion:'reduce'},async page => {
    const rail = page.locator('[data-journey-title="NudeProject"]'); await rail.scrollIntoViewIfNeeded()
    const cdp = await page.context().newCDPSession(page)
    const touch = async (from,to) => {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from.x,y:from.y}]})
      for (let step=1;step<=8;step++) {
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*step/8,y:from.y+(to.y-from.y)*step/8}]})
        await page.waitForTimeout(16)
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    }
    let box = await rail.boundingBox()
    const before = await page.evaluate(() => scrollY)
    const track = rail.locator('[data-title-track]'); const initial = await track.evaluate(element => getComputedStyle(element).transform)
    await touch({x:260,y:box.y+box.height/2},{x:100,y:box.y+box.height/2+2})
    assert.notEqual(await track.evaluate(element => getComputedStyle(element).transform),initial,'native touch drags text')
    assert.ok(Math.abs(await page.evaluate(() => scrollY)-before)<5,'horizontal drag keeps vertical position')
    box=await rail.boundingBox()
    await touch({x:180,y:box.y+box.height/2},{x:182,y:box.y+box.height/2-170})
    assert.ok(await page.evaluate(() => scrollY)>before+40,'vertical gesture remains native scroll')
    await cdp.detach()
  })
  console.log(JSON.stringify(results,null,2))
  if (results.some(result => result.status === 'FAIL')) process.exitCode = 1
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
