import { chromium, firefox } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const base = process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:3101'
const out = process.env.PUBLIC_TEST_OUTPUT || '.audit/project-images-20260922/verified'
await fs.mkdir(out, {recursive:true})
const engine = process.argv.includes('--firefox') ? firefox : chromium
const report = {base, engine:engine.name(), checks:[], errors:[]}
const browser = await engine.launch()
const pass = (check,detail) => {report.checks.push({check,detail}); console.log('PASS',check)}
const consent = async p => {const b=p.getByRole('button',{name:'Cerrar preferencias sin cambiar la elección'}); if(await b.isVisible()) await b.click()}
try {
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
 p.on('pageerror',e=>report.errors.push(String(e)))
 await p.goto(base,{waitUntil:'networkidle'}); await consent(p)
 const gallery=p.locator('.rd-art-gallery'),track=p.locator('#art-gallery-track')
 await gallery.scrollIntoViewIfNeeded()
 const box=await track.boundingBox(); const x=box.x+box.width*.45, y=box.y+130
 const before=await track.evaluate(e=>e.scrollLeft)
 await p.mouse.move(x,y); await p.mouse.down(); await p.mouse.move(x-190,y,{steps:12}); await p.mouse.up()
 assert.equal(new URL(p.url()).pathname,'/')
 const after=await track.evaluate(e=>e.scrollLeft); assert(after>before+130,`drag left ${before} ${after}`)
 await p.mouse.move(x,y); await p.mouse.down(); await p.mouse.move(x+100,y,{steps:10}); await p.mouse.up()
 assert((await track.evaluate(e=>e.scrollLeft))<after-60)
 assert.equal(await track.getAttribute('data-dragging'),null)
 pass('Arrastre en ambos sentidos sin navegación accidental', {before,after})
 await track.evaluate(e=>e.scrollLeft=0)
 const first=p.locator('.rd-art-gallery__item').first(); await track.focus(); await p.keyboard.press('Tab')
 assert(await first.evaluate(e=>e===document.activeElement), 'Tab reaches first gallery link')
 assert.equal(await first.evaluate(e=>getComputedStyle(e,'::before').opacity),'0.9')
 await first.screenshot({path:`${out}/thumbnail-neon-dark.png`})
 await gallery.screenshot({path:`${out}/gallery-dark.png`})
 const gaps=await p.evaluate(()=>{
  const g=document.querySelector('.rd-art-gallery').getBoundingClientRect(),l=document.querySelector('#casos > .rd-label').getBoundingClientRect(),h=document.querySelector('#casos h2').getBoundingClientRect(),intro=document.querySelector('#casos .rd-cases-intro').getBoundingClientRect(),c=document.querySelector('#casos .rd-case').getBoundingClientRect()
  return {before:l.top-g.bottom,label:h.top-l.bottom,after:c.top-intro.bottom}
 })
 assert(gaps.before>=60 && gaps.before<=100,JSON.stringify(gaps)); assert(gaps.label<20); assert(gaps.after>=120,JSON.stringify(gaps))
 pass('Separación y jerarquía editorial',gaps)
 await first.press('Enter'); await p.waitForURL('**/proyectos/buy-sell-marketplace')
 pass('Enlace de miniatura accesible con teclado')
 await p.goto(base,{waitUntil:'networkidle'}); await consent(p); await gallery.scrollIntoViewIfNeeded()
 await first.click(); await p.waitForURL('**/proyectos/buy-sell-marketplace'); pass('Clic simple de miniatura conserva navegación')
 await p.goto(base,{waitUntil:'networkidle'}); await consent(p); await p.locator('.rd-theme-btn:visible').click(); await gallery.scrollIntoViewIfNeeded()
 await first.hover(); await p.waitForTimeout(250); await gallery.screenshot({path:`${out}/gallery-light.png`})
 await p.close()
 for (const width of [320,390,768,1024,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2,reducedMotion:'reduce',hasTouch:width<1024})
  page.on('pageerror',e=>report.errors.push(String(e)))
  for(const slug of ['buy-sell-marketplace','laliga-club-operations-hub','the-ux-union','nude-project']) {
   await page.goto(`${base}/proyectos/${slug}`,{waitUntil:'networkidle'}); await consent(page)
   const images=page.locator('.rd-project-evidence img'), measures=[]
   assert(await images.count()>0,slug)
   for(let i=0;i<await images.count();i++) {
    const img=images.nth(i); await img.scrollIntoViewIfNeeded(); await img.evaluate(e=>e.decode())
    const m=await img.evaluate(e=>{const r=e.getBoundingClientRect(),a=e.closest('a');return {w:r.width,h:r.height,ratio:Number(e.getAttribute('width'))/Number(e.getAttribute('height')),src:e.currentSrc,portrait:a.dataset.portrait==='true',link:a.getAttribute('href'),x:r.x,doc:document.documentElement.scrollWidth}})
    assert(m.w>0 && m.h>0 && m.h<=900*.83,`${slug} ${width} oversized: ${JSON.stringify(m)}`)
    assert(Math.abs(m.w/m.h-m.ratio)<.015,`${slug}: distortion`)
    if (m.x < -1 || m.x + m.w > width + 1) await page.screenshot({path:`${out}/overflow-${slug}-${width}-${i}.png`})
    assert(m.x>=-1 && m.x+m.w<=width+1,`${slug} ${width} image ${i} overflow ${JSON.stringify(m)}`)
    assert(m.doc<=width+1,`${slug} ${width} document overflow ${m.doc}`)
    if(m.portrait) assert(m.w>=Math.min(210,width-70),`${slug} ${width} tiny portrait ${m.w}`)
    assert(m.src.includes('q=92')); assert(m.link.startsWith('/projects/'))
    measures.push(m)
   }
   const last=page.locator('.rd-project-evidence').last(); await page.keyboard.press('Tab'); await last.focus(); assert(await last.evaluate(e=>e.matches(':focus-visible')))
   if(slug==='nude-project') {
    await page.locator('.rd-case-phase__visual').first().scrollIntoViewIfNeeded()
    await page.screenshot({path:`${out}/nude-evidence-${width}.png`})
   }
   pass(`Imágenes ${slug} a ${width}px`,measures)
  }
  await page.goto(base,{waitUntil:'networkidle'}); await consent(page)
  await page.locator('.rd-art-gallery').scrollIntoViewIfNeeded()
  const slider=page.locator('.rd-art-gallery__position'); await slider.focus(); await slider.press('End')
  assert.equal(await slider.inputValue(),'1000'); await slider.press('Home'); assert.equal(await slider.inputValue(),'0')
  const bounds=await slider.boundingBox(); assert(bounds.height>=44 && bounds.x>=0 && bounds.x+bounds.width<=width)
  if(width<1024) {await page.touchscreen.tap(bounds.x+bounds.width*.75,bounds.y+bounds.height/2); assert(Number(await slider.inputValue())>500)}
  pass(`Control alternativo de carrusel a ${width}px`)
  await page.close()
 }
 assert.deepEqual(report.errors,[])
 report.result='PASS'
} catch(e) {report.result='FAIL';report.failure=String(e.stack??e);console.error(report.failure);process.exitCode=1}
finally {await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2));await browser.close()}
