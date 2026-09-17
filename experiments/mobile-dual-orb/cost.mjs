import {chromium} from 'playwright'
const browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.addInitScript(()=>{Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});localStorage.setItem('rd-theme','dark')})
 await page.goto('http://127.0.0.1:3032',{waitUntil:'domcontentloaded'})
 await page.locator('.rd-dual-warm').waitFor({state:'attached',timeout:60000})
 await page.evaluate(()=>{const s=document.querySelector('.rd-hero-canvas-stage').getBoundingClientRect();scrollTo(0,scrollY+s.top-330)})
 const results=[]
 const modes=process.argv.includes('--compare-clip')?['full','clipped','blue','clipped','full']:['clipped','blue','clipped']
 let wasDual=true
 for(const mode of modes){
  const dual=mode!=='blue'
  if(!dual&&wasDual)await page.getByRole('button',{name:'Comparar: solo azul'}).click()
  if(dual&&!wasDual)await page.getByRole('button',{name:'Comparar: dos orbes'}).click()
  wasDual=dual
  await page.locator('.rd-dual-warm').evaluate((e,mode)=>{const g=e.getContext('webgl');if(!g.originalScissor)g.originalScissor=g.scissor.bind(g);g.scissor=mode==='full'?()=>g.originalScissor(0,0,320,320):g.originalScissor},mode)
  await page.waitForTimeout(1000)
  results.push(await page.evaluate(async mode=>{
   const samples=[],start=performance.now();let previous=start
   await new Promise(resolve=>{function tick(now){samples.push(now-previous);previous=now;if(now-start<2000)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})
   samples.sort((a,b)=>a-b);return {mode,samples:samples.length,medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)]}
  },mode))
 }
 await page.screenshot({path:'.audit/mobile-dual-orb/two-clean.png',style:'.rd-dual-toggle{visibility:hidden!important}'})
 console.log(JSON.stringify({results,limitation:'Software Chromium only; not physical phone scroll FPS.'},null,2))
}finally{await browser.close()}
