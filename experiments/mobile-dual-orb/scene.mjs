// Throwaway prototype. Does not change the blue orb or public source.
const {vertex,fragment}=await fetch('/__dual/shader.json').then(r=>r.json())
const wait=()=>new Promise(resolve=>requestAnimationFrame(resolve))
while(!document.querySelector('.rd-hero-art[data-ready="true"]'))await wait()
const hero=document.querySelector('.rd-hero'),stage=hero.querySelector('.rd-hero-canvas-stage')
const style=document.createElement('style')
style.textContent=`@media(max-width:767px){.rd-hero{isolation:isolate;overflow:clip}.rd-hero-copy,.rd-hero-art{z-index:2}.rd-hero-copy{position:relative}.rd-dual-warm{position:absolute;z-index:1;pointer-events:none}.rd-dual-toggle{position:fixed;right:12px;bottom:12px;z-index:999;background:#191919;color:#fff;border:1px solid #777;border-radius:20px;padding:10px 14px;font:13px system-ui}}@media(min-width:768px){.rd-dual-warm,.rd-dual-toggle{display:none}}`
document.head.append(style)
hero.style.position='relative'
const canvas=document.createElement('canvas');canvas.className='rd-dual-warm';canvas.setAttribute('aria-hidden','true');hero.append(canvas)
const button=document.createElement('button');button.className='rd-dual-toggle';button.textContent='Comparar: solo azul';document.body.append(button)
const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'})
if(!gl)throw Error('Warm orb WebGL unavailable')
const program=gl.createProgram()
for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
 const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(program,s)
}
gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program)
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0)
const uniforms=Object.fromEntries(['resolution','time','lightTheme','cameraZoom','verticalOffset','pressStrength','lightStrength'].map(k=>[k,gl.getUniformLocation(program,k)]))
const mobile=matchMedia('(max-width:767px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)')
let frame=0,last=0,elapsed=13,visible=true,enabled=true,draws=0
function layout(){
 const h=hero.getBoundingClientRect(),s=stage.getBoundingClientRect(),size=s.width*1.6
 canvas.style.width=canvas.style.height=`${size}px`;canvas.style.left=`${s.left-h.left+s.width*.22}px`;canvas.style.top=`${s.top-h.top-size*.43}px`
 canvas.width=canvas.height=320;gl.viewport(0,0,320,320);paint()
}
function paint(){
 gl.uniform2f(uniforms.resolution,320,320);gl.uniform1f(uniforms.time,elapsed)
 gl.uniform1f(uniforms.cameraZoom,2.5);gl.uniform1f(uniforms.verticalOffset,0)
 gl.uniform1f(uniforms.lightTheme,document.documentElement.dataset.theme==='light'?1:0)
 gl.uniform1f(uniforms.pressStrength,0);gl.uniform1f(uniforms.lightStrength,0)
 gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.draws=String(++draws)
}
function tick(now){frame=0;if(!mobile.matches||!enabled||!visible||document.hidden||reduced.matches)return
 if(now-last>=1000/15){if(last)elapsed+=(now-last)/1000*.75;last=now;paint()}frame=requestAnimationFrame(tick)
}
function update(){cancelAnimationFrame(frame);frame=0;last=0;canvas.hidden=!enabled;paint();if(mobile.matches&&enabled&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick)}
button.onclick=()=>{enabled=!enabled;button.textContent=enabled?'Comparar: solo azul':'Comparar: dos orbes';update()}
new ResizeObserver(layout).observe(stage)
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update()}).observe(canvas)
new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
document.addEventListener('visibilitychange',update);mobile.addEventListener('change',update);reduced.addEventListener('change',update)
layout();update()
