import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const file='src/features/redesign/components/organic-orb-shaders.ts'
const extract=s=>({vertex:s.match(/ORB_VERTEX = `([\s\S]*?)`/)[1],fragment:s.match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]})
const baseline=extract(execFileSync('git',['show',`f38e1a2:${file}`],{encoding:'utf8'})),candidate=extract(await readFile(file,'utf8'))
const browser=await chromium.launch()
await mkdir('.audit/fluid-light',{recursive:true})
try{
 const page=await browser.newPage()
 const results=await page.evaluate(({baseline,candidate})=>{
  const c=document.createElement('canvas');c.width=c.height=384
  const gl=c.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true})
  const make=({vertex,fragment})=>{const p=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
  const programs=[make(baseline),make(candidate)]
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
  const render=(program,theme,light)=>{
   gl.useProgram(program);const a=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
   gl.uniform2f(gl.getUniformLocation(program,'resolution'),384,384)
   gl.uniform2f(gl.getUniformLocation(program,'lightPoint'),.2,.1);gl.uniform2f(gl.getUniformLocation(program,'lightTrail'),-.35,-.1)
   for(const [k,v] of Object.entries({time:4,lightTheme:theme,cameraZoom:2.6,verticalOffset:0,pressAge:0,pressStrength:0,lightStrength:light}))gl.uniform1f(gl.getUniformLocation(program,k),v)
   const start=performance.now();gl.drawArrays(gl.TRIANGLES,0,6)
   const pixels=new Uint8Array(384*384*4);gl.readPixels(0,0,384,384,gl.RGBA,gl.UNSIGNED_BYTE,pixels)
   const ms=performance.now()-start
   if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL error')
   return {pixels,ms,image:c.toDataURL()}
  }
  return [0,1].map(theme=>{
   const old=render(programs[0],theme,0),idle=render(programs[1],theme,0),lit=render(programs[1],theme,1)
   let idleMax=0,alphaMax=0,changed=0
   for(let i=0;i<old.pixels.length;i++){idleMax=Math.max(idleMax,Math.abs(old.pixels[i]-idle.pixels[i]));if(i%4===3)alphaMax=Math.max(alphaMax,Math.abs(idle.pixels[i]-lit.pixels[i]));else if(Math.abs(idle.pixels[i]-lit.pixels[i])>8)changed++}
   const samples=[[],[],[]];for(let n=0;n<5;n++)for(let k=0;k<3;k++)samples[k].push(render(programs[k===0?0:1],theme,k===2?1:0).ms)
   return {theme,idleMax,alphaMax,changed,medianMs:samples.map(s=>s.sort((a,b)=>a-b)[2]),image:lit.image}
  })
 },{baseline,candidate})
 for(const r of results){assert.ok(r.idleMax<=2,'idle/mobile rendering preserved');assert.equal(r.alphaMax,0,'light cannot escape silhouette');assert.ok(r.changed>100,'light visibly changes internal liquid');await writeFile(`.audit/fluid-light/${r.theme}.png`,Buffer.from(r.image.split(',')[1],'base64'));delete r.image}
 console.log(JSON.stringify({results,limitation:'Software GPU comparison, not physical-device FPS.'},null,2))
}finally{await browser.close()}
