// Fixed visual baseline and isolated GPU completion timings; never shipped to clients.
import {readFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const path='src/features/redesign/components/organic-orb-shaders.ts'
const baseline=execFileSync('git',['show',`4cd3aac:${path}`],{encoding:'utf8'})
const candidate=await readFile(path,'utf8')
const extract=s=>({vertex:s.match(/ORB_VERTEX = `([\s\S]*?)`/)[1],fragment:s.match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]})
const browser=await chromium.launch()
try{
 const page=await browser.newPage()
 const results=await page.evaluate(({baseline,candidate})=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=384
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false})
  const make=({vertex,fragment})=>{
   const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
   const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p
  }
  const programs=[make(baseline),make(candidate)]
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
  const render=(p,time,theme,strength)=>{
   gl.useProgram(p);const a=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
   gl.uniform2f(gl.getUniformLocation(p,'resolution'),384,384);gl.uniform2f(gl.getUniformLocation(p,'pressPoint'),.4,.2)
   for(const [k,v] of Object.entries({time,lightTheme:theme,cameraZoom:2.5,verticalOffset:0,pressAge:3.5,pressStrength:strength}))gl.uniform1f(gl.getUniformLocation(p,k),v)
   const pixel=new Uint8Array(4);gl.readPixels(192,192,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel)
   const start=performance.now();gl.drawArrays(gl.TRIANGLES,0,6);gl.readPixels(192,192,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel)
   if(gl.getError()!==gl.NO_ERROR||pixel[3]===0)throw Error('benchmark must render visible liquid without WebGL errors')
   return performance.now()-start
  }
  const results=[]
  for(const [time,theme,strength] of [[0,0,0],[4,1,0],[9,0,0],[4,0,1]]){
   const images=[],timings=[]
   for(const p of programs){
    render(p,time,theme,strength)
    const samples=[];for(let i=0;i<7;i++)samples.push(render(p,time,theme,strength))
    samples.sort((a,b)=>a-b);timings.push(samples[3])
    const pixels=new Uint8Array(384*384*4);gl.readPixels(0,0,384,384,gl.RGBA,gl.UNSIGNED_BYTE,pixels);images.push(pixels)
   }
   let max=0,changed=0,total=0
   for(let i=0;i<images[0].length;i++){const delta=Math.abs(images[0][i]-images[1][i]);max=Math.max(max,delta);total+=delta;if(delta>2)changed++}
   results.push({time,theme,strength,baselineMs:timings[0],candidateMs:timings[1],maxChannelDelta:max,meanChannelDelta:total/images[0].length,changedChannelsOver2:changed})
  }
  return results
 },{baseline:extract(baseline),candidate:extract(candidate)})
 console.log(JSON.stringify(results,null,2))
 for(const r of results)assert.ok(r.maxChannelDelta<=2,'same geometry, transparency and colours within two 8-bit rounding levels')
 const ratio=results.reduce((s,r)=>s+r.candidateMs,0)/results.reduce((s,r)=>s+r.baselineMs,0)
 console.log({ratio})
 // Opt in for a performance candidate; unchanged baseline is also useful as a
 // visual/control run. Report all timings regardless of gate selection.
 if(process.argv.includes('--require-improvement')) assert.ok(ratio<.85,'candidate must show at least 15% reduction in this isolated GPU-completion benchmark')
}finally{await browser.close()}
