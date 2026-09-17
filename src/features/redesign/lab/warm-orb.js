// Isolated opt-in lab. Never imported by the homepage.
import {ORB_VERTEX,ORB_FRAGMENT} from '../components/organic-orb-shaders'
/** @param {HTMLElement} hero */
export function mountWarmOrb(hero){
const document=hero.ownerDocument,window=document.defaultView
const requestAnimationFrame=window.requestAnimationFrame.bind(window),cancelAnimationFrame=window.cancelAnimationFrame.bind(window),matchMedia=window.matchMedia.bind(window)
const cleanups=[];let disposed=false
function cleanup(){if(disposed)return;disposed=true;for(const fn of cleanups.reverse())fn()}
try{
const vertex=ORB_VERTEX
const fragment=ORB_FRAGMENT
 .replace('vec3(.025,.19,.68), cyan=vec3(.015,.75,.9), violet=vec3(.45,.12,.75)','vec3(.8,.12,.015), cyan=vec3(1.,.68,.025), violet=vec3(.95,.25,.01)')
 .replace('vec3(.48,.16,.82)','vec3(.95,.3,.015)').replace('vec3(.85,.3,.57)','vec3(1.,.79,.08)')
 .replace('vec3(.09,.25,.28)','vec3(.28,.19,.035)').replace('vec3(.2,.82,1.),vec3(.06,.28,.54)','vec3(1.,.72,.18),vec3(.58,.22,.015)')
 .replace('vec3(.8,.9,1.)','vec3(1.,.93,.64)')
const connectedFragment=fragment.replace('uniform float time;','uniform float time; uniform float absorption;').replace('gl_FragColor=vec4(color,coverage);',`float sweep=0.5+0.5*sin(gl_FragCoord.x/resolution.x*6.+gl_FragCoord.y/resolution.y*4.-time*2.);
color=mix(color,vec3(1.,.55+.35*sweep,.26+.3*(1.-sweep)),absorption*.32);
gl_FragColor=vec4(color,coverage);`)
const stage=hero.querySelector('.rd-hero-canvas-stage')
if(!stage)return cleanup
const style=document.createElement('style')
style.textContent=`@media(max-width:767px){.rd-hero{isolation:isolate;overflow:clip}.rd-hero-copy,.rd-hero-art{z-index:2}.rd-hero-copy{position:relative}.rd-dual-warm{position:absolute;z-index:1;pointer-events:none}.rd-dual-toggle{position:fixed;right:12px;bottom:12px;z-index:999;background:#191919;color:#fff;border:1px solid #777;border-radius:20px;padding:10px 14px;font:13px system-ui}}@media(min-width:768px){.rd-dual-warm,.rd-dual-toggle{display:none}}`
document.head.append(style);cleanups.push(()=>style.remove())
style.textContent+=`.rd-transfer-drop{position:absolute;z-index:3;pointer-events:none;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#d8fcff,#25ccff 20%,#253fba 65%,#813ec0);box-shadow:inset -2px -2px 4px #19335d;opacity:0;will-change:transform}.rd-dual-warm{transform-origin:50% 50%;opacity:0}@media(min-width:768px){.rd-transfer-drop{display:none}}`
const oldPosition=hero.style.position;hero.style.position='relative';cleanups.push(()=>{hero.style.position=oldPosition})
const canvas=document.createElement('canvas');canvas.className='rd-dual-warm';canvas.setAttribute('aria-hidden','true');hero.append(canvas);cleanups.push(()=>canvas.remove())
const button=document.createElement('button');button.className='rd-dual-toggle';button.textContent='Comparar: solo azul';document.body.append(button);cleanups.push(()=>button.remove())
const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'})
if(!gl)throw Error('Warm orb WebGL unavailable')
const program=gl.createProgram();cleanups.push(()=>gl.deleteProgram(program))
for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,connectedFragment]]){
 const s=gl.createShader(type);cleanups.push(()=>gl.deleteShader(s));gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(program,s)
}
gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program)
const buffer=gl.createBuffer();cleanups.push(()=>gl.deleteBuffer(buffer));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0)
const uniforms=Object.fromEntries(['resolution','time','lightTheme','cameraZoom','verticalOffset','pressStrength','lightStrength','absorption'].map(k=>[k,gl.getUniformLocation(program,k)]))
const mobile=matchMedia('(max-width:767px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)')
let frame=0,last=0,elapsed=13,visible=true,enabled=true,draws=0
cleanups.push(()=>cancelAnimationFrame(frame))
let formation=0,flowTime=0,pulse=0,absorptions=0,geometry=null
const droplets=Array.from({length:2},(_,i)=>{const element=document.createElement('i');element.className='rd-transfer-drop';element.setAttribute('aria-hidden','true');hero.append(element);cleanups.push(()=>element.remove());return {element,previous:-1,offset:i*3.5}})
function reveal(){
 const top=stage.getBoundingClientRect().top
 const progress=window.scrollY<8?0:Math.max(0,Math.min(1,(window.innerHeight+80-top)/(window.innerHeight*.75)))
 formation=progress*progress*(3-2*progress)
 canvas.style.opacity=String(formation)
 canvas.style.transform=reduced.matches?'none':`scale(${.12+.88*formation})`
}
function transfer(dt){
 pulse=Math.max(0,pulse-dt*.65)
 if(formation<.95||!geometry){for(const d of droplets)d.element.style.opacity='0';return}
 flowTime+=dt
 const {start,end}=geometry
 for(const d of droplets){
  const cycle=flowTime-d.offset,phase=cycle>=0?cycle%9:-1
  if(d.previous>=0&&d.previous<2.8&&phase>=2.8){pulse=1;canvas.dataset.absorptions=String(++absorptions)}
  d.previous=phase
  if(phase<0||phase>=2.8){d.element.style.opacity='0';continue}
  const p=phase/2.8,ease=p*p*(3-2*p),x=start.x+(end.x-start.x)*ease,y=start.y+(end.y-start.y)*ease-Math.sin(p*Math.PI)*36
  d.element.style.transform=`translate(${x}px,${y}px) scale(${.5+.5*Math.sin(Math.PI*p)})`
  d.element.style.opacity=String(Math.min(1,p*8,(1-p)*8))
 }
}
function layout(){
 if(disposed)return
 const h=hero.getBoundingClientRect(),s=stage.getBoundingClientRect(),size=s.width*1.6
 canvas.style.width=canvas.style.height=`${size}px`;canvas.style.left=`${s.left-h.left+s.width*.22}px`;canvas.style.top=`${s.top-h.top-size*.43}px`
 geometry={start:{x:s.left-h.left+s.width*.65,y:s.top-h.top+s.height*.42},end:{x:s.left-h.left+s.width*.22+size*.37,y:s.top-h.top-size*.43+size*.46}}
 reveal()
 canvas.width=canvas.height=320;gl.viewport(0,0,320,320);paint()
}
function paint(){
 // Rasterize only visible pixels, preserving the full-resolution coordinate
 // system and a one-pixel guard for the filtered edge during scroll/scale.
 const rect=canvas.getBoundingClientRect(),clamp=v=>Math.max(0,Math.min(320,v))
 if(rect.width<=0||rect.height<=0)return
 const left=clamp(Math.floor(-rect.left/rect.width*320)-1)
 const right=clamp(Math.ceil((window.innerWidth-rect.left)/rect.width*320)+1)
 const bottom=clamp(Math.floor((rect.bottom-window.innerHeight)/rect.height*320)-1)
 const top=clamp(Math.ceil(rect.bottom/rect.height*320)+1)
 gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT)
 gl.enable(gl.SCISSOR_TEST);gl.scissor(left,bottom,Math.max(0,right-left),Math.max(0,top-bottom))
 gl.uniform2f(uniforms.resolution,320,320);gl.uniform1f(uniforms.time,elapsed)
 gl.uniform1f(uniforms.cameraZoom,2.5);gl.uniform1f(uniforms.verticalOffset,0)
 gl.uniform1f(uniforms.lightTheme,document.documentElement.dataset.theme==='light'?1:0)
 gl.uniform1f(uniforms.pressStrength,0);gl.uniform1f(uniforms.lightStrength,0)
 gl.uniform1f(uniforms.absorption,reduced.matches?0:pulse)
 gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.draws=String(++draws)
}
function tick(now){frame=0;if(disposed)return;if(!mobile.matches||!enabled||!visible||document.hidden||reduced.matches)return
 if(now-last>=1000/15){const dt=last?Math.min((now-last)/1000,.3):0;elapsed+=dt*.75;transfer(dt);last=now;if(formation>0)paint()}frame=requestAnimationFrame(tick)
}
function update(){if(disposed)return;cancelAnimationFrame(frame);frame=0;last=0;canvas.hidden=!enabled;for(const d of droplets)d.element.style.opacity='0';if(reduced.matches)pulse=0;reveal();paint();if(mobile.matches&&enabled&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick)}
button.onclick=()=>{enabled=!enabled;button.textContent=enabled?'Comparar: solo azul':'Comparar: dos orbes';update()}
const resize=new window.ResizeObserver(layout);resize.observe(stage);cleanups.push(()=>resize.disconnect())
const intersection=new window.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update()});intersection.observe(stage);cleanups.push(()=>intersection.disconnect())
const theme=new window.MutationObserver(update);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});cleanups.push(()=>theme.disconnect())
document.addEventListener('visibilitychange',update);mobile.addEventListener('change',update);reduced.addEventListener('change',update)
const scroll=()=>{reveal();if(reduced.matches)paint()};document.addEventListener('scroll',scroll,{passive:true})
cleanups.push(()=>{document.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',update);mobile.removeEventListener('change',update);reduced.removeEventListener('change',update)})
const lost=event=>{event.preventDefault();cleanup()};canvas.addEventListener('webglcontextlost',lost);cleanups.push(()=>canvas.removeEventListener('webglcontextlost',lost))
layout();update()


return cleanup
}catch(error){cleanup();throw error}
}
