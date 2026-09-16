import {readFile} from 'node:fs/promises'
import {chromium} from 'playwright'
const html=await readFile('experiments/hero-organic/index.html','utf8')
const shader=(await readFile('src/features/redesign/components/organic-orb-shaders.ts','utf8')).match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]
const browser=await chromium.launch()
try{
  for(const compact of [false,true])for(const theme of ['dark','light']){
    const page=await browser.newPage({viewport:{width:600,height:900},reducedMotion:'reduce'})
    let source=html.replace(/const fragment = `[\s\S]*?`;/,()=>`const fragment = \`${shader}\`;`)
    source=source.replace('gl.drawArrays(gl.TRIANGLES,0,6);',`gl.uniform1f(gl.getUniformLocation(program,'cameraZoom'),${compact?2.35:2.6});gl.uniform1f(gl.getUniformLocation(program,'verticalOffset'),0);gl.drawArrays(gl.TRIANGLES,0,6);`)
    await page.setContent(source)
    if(theme==='light')await page.getByRole('button',{name:'Tema claro'}).click()
    await page.addStyleTag({content:'body{background:transparent!important}canvas{width:384px;height:384px}'})
    await page.evaluate(()=>window.dispatchEvent(new Event('resize')))
    const path=`public/art/hero-organic-static-${compact?'mobile-v2-':''}${theme}.png`
    await page.locator('canvas').screenshot({path,omitBackground:true})
    console.log('Captured',path)
    await page.close()
  }
}finally{await browser.close()}
