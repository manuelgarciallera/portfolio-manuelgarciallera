import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import sharp from 'sharp'

// Catches a binary-alpha silhouette (the visible staircase), not a CSS blur.
const source=await readFile('src/features/redesign/components/organic-orb-shaders.ts','utf8')
const vertex=source.match(/ORB_VERTEX = `([\s\S]*?)`/)[1]
const fragment=source.match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]
await mkdir('.audit/orb-edge',{recursive:true})
const browser=await chromium.launch()
try {
 const page=await browser.newPage()
 for(const time of [0,4,9]) {
  const url=await page.evaluate(({vertex,fragment,time})=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=384
   const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false})
   const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
   const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p)
   gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
   const a=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
   gl.uniform2f(gl.getUniformLocation(p,'resolution'),384,384)
   for(const [key,value] of Object.entries({time,lightTheme:0,cameraZoom:2.5,verticalOffset:0}))gl.uniform1f(gl.getUniformLocation(p,key),value)
   gl.drawArrays(gl.TRIANGLES,0,6)
   return canvas.toDataURL()
  },{vertex,fragment,time})
  const png=Buffer.from(url.split(',')[1],'base64')
  await writeFile(`.audit/orb-edge/frame-${time}.png`,png)
  const {data}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  let edge=0,solid=0,clear=0
  for(let i=3;i<data.length;i+=4){if(data[i]>8&&data[i]<247)edge++;if(data[i]===255)solid++;if(data[i]===0)clear++}
  console.log({time,edge,solid,clear})
  assert.ok(edge>200,'silhouette must contain subpixel coverage, not only opaque/transparent steps')
  assert.ok(edge<5000,'smoothing stays at the contour, not a broad translucent blur')
  assert.ok(solid>35000&&clear>35000,'retain solid liquid and transparent surroundings')
 }
} finally {await browser.close()}
