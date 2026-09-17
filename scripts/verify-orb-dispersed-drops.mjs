// Compare actual WebGL output with the pre-droplet version, not shader text.
import {readFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const path='src/features/redesign/components/organic-orb-shaders.ts'
const extract=s=>({vertex:s.match(/ORB_VERTEX = `([\s\S]*?)`/)[1],fragment:s.match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]})
const baseline=extract(execFileSync('git',['show',`1f8337a:${path}`],{encoding:'utf8'}))
const candidate=extract(await readFile(path,'utf8'))
const browser=await chromium.launch()
try {
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
  const results=[]
  for(const zoom of [2.5,2.6])for(const time of [0,4,9]){
   const images=[],cost=[]
   for(const p of programs){
    gl.useProgram(p);const a=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
    gl.uniform2f(gl.getUniformLocation(p,'resolution'),384,384)
    gl.uniform1f(gl.getUniformLocation(p,'cameraZoom'),zoom);gl.uniform1f(gl.getUniformLocation(p,'time'),time)
    const pixels=new Uint8Array(384*384*4),samples=[]
    for(let i=0;i<6;i++){const start=performance.now();gl.drawArrays(gl.TRIANGLES,0,6);gl.readPixels(0,0,384,384,gl.RGBA,gl.UNSIGNED_BYTE,pixels);if(i)samples.push(performance.now()-start)}
    samples.sort((a,b)=>a-b);cost.push(samples[2]);images.push(pixels)
   }
   const added=new Set();let bodyChanges=0
   for(let y=0;y<384;y++)for(let x=0;x<384;x++){
    const i=(y*384+x)*4
    if(images[1][i+3]>100&&images[0][i+3]===0)added.add(y*384+x)
    if(Math.hypot(x-192,y-192)<90)for(let c=0;c<4;c++)if(Math.abs(images[0][i+c]-images[1][i+c])>2)bodyChanges++
   }
   const clusters=[]
   while(added.size){const first=added.values().next().value,queue=[first];added.delete(first);let count=0
    while(queue.length){const n=queue.pop();count++;for(const d of [-384,384,-1,1])if(added.delete(n+d))queue.push(n+d)}
    if(count>=5)clusters.push(count)
   }
   results.push({zoom,time,clusters,bodyChanges,baselineMs:cost[0],candidateMs:cost[1]})
  }
  return results
 },{baseline,candidate})
 console.log(JSON.stringify(results,null,2))
 for(const r of results){assert.equal(r.clusters.length,4,'four additional detached visible droplets');assert.equal(r.bodyChanges,0,'main liquid keeps its existing appearance')}
 console.log('Software GPU cost ratio (not physical mobile FPS):',results.reduce((s,r)=>s+r.candidateMs,0)/results.reduce((s,r)=>s+r.baselineMs,0))
} finally {await browser.close()}
