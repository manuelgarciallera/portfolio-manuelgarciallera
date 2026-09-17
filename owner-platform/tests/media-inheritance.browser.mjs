import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const directory=fileURLToPath(new URL('../',import.meta.url))
const bundle=await build({absWorkingDir:directory,bundle:true,write:false,outdir:'unused-output',format:'iife',jsx:'automatic',
 alias:{'@payloadcms/ui':fileURLToPath(new URL('./media-inheritance-context.fixture.tsx',import.meta.url))},
 stdin:{resolveDir:directory,loader:'tsx',contents:`
 import {createRoot} from 'react-dom/client';
 import {Provider} from './tests/media-inheritance-context.fixture';
 import {MediaPlacementEditor} from './src/components/MediaPlacementEditor';
 createRoot(document.getElementById('root')).render(<Provider><MediaPlacementEditor readOnly={new URLSearchParams(location.search).get('mode')==='readonly'}/></Provider>);
 `}})
const js=bundle.outputFiles.find(f=>f.path.endsWith('.js')).text
const css=bundle.outputFiles.find(f=>f.path.endsWith('.css')).text
const browser=await chromium.launch()
try{
 for(const width of [320,390,1280]) for(const mode of ['edit','readonly','saving','initializing']){
  const page=await browser.newPage({viewport:{width,height:900}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/*',route=>{
   const path=new URL(route.request().url()).pathname
   if(path==='/api/media/12')return route.fulfill({json:{id:12,alt:'Synthetic crop',url:'/api/media/file/fixture.svg',width:600,height:400}})
   if(path==='/api/media/file/fixture.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#34664b"/></svg>'})
   return route.fulfill({contentType:'text/html',body:`<html lang="es"><head><style>:root{--theme-bg:#fff;--theme-text:#171717;--theme-elevation-100:#f4f4f4;--theme-elevation-150:#ddd;--theme-elevation-250:#aaa;--theme-elevation-650:#555;--theme-elevation-700:#444;--theme-input-bg:#fff;--theme-success-500:#007453}*{box-sizing:border-box}body{font-family:Arial;margin:12px}${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`})
  })
  await page.goto(`http://owner.test/?mode=${mode}`)
  const editor=page.getByRole('region',{name:'Encuadre reversible'})
  await editor.waitFor()
  await editor.getByRole('button',{name:'Mobile',exact:true}).click()
  const reset=editor.getByRole('button',{name:'Usar encuadre de escritorio',exact:true})
  assert.equal(await reset.count(),1,'Mobile must offer a visible way back to desktop inheritance')
  const zoom=editor.getByRole('slider',{name:/^Zoom/})
  assert.equal(await zoom.inputValue(),'4')
  if(mode==='edit'){
   assert.equal(await reset.isEnabled(),true)
   await reset.press('Enter')
   assert.equal(await zoom.inputValue(),'1')
   assert.equal(await editor.getByRole('slider',{name:/Punto focal vertical/}).inputValue(),'50')
   assert.equal(await reset.isDisabled(),true)
   assert.match(await editor.innerText(),/Usa el encuadre de escritorio/)
   await editor.getByRole('button',{name:'Tablet',exact:true}).click()
   assert.equal(await zoom.inputValue(),'2','Resetting mobile preserves tablet overrides')
   await editor.getByRole('button',{name:'Desktop',exact:true}).click()
   assert.equal(await zoom.inputValue(),'1','Resetting mobile preserves the base')
   await editor.getByRole('button',{name:'Mobile',exact:true}).click()
   await zoom.press('End')
   assert.equal(await reset.isEnabled(),true,'Customizing after reset remains possible')
   await reset.click()
  }else{
   assert.equal(await reset.isDisabled(),true,'Read-only and busy forms cannot reset overrides')
   assert.equal(await zoom.isDisabled(),true)
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  assert.deepEqual(errors,[])
  if(mode==='edit'){
   await mkdir('.data/verification-artifacts/media-inheritance',{recursive:true})
   await page.screenshot({path:`.data/verification-artifacts/media-inheritance/${width}.png`,fullPage:true})
  }
  console.log('PASS responsive inheritance component',width,mode)
  await page.close()
 }
}finally{await browser.close()}
