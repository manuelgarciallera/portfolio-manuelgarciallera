import {createEmitter} from './bubbles.mjs'
const hero=document.querySelector('.rd-hero'),orb=document.querySelector('.rd-hero-canvas-stage'),heading=document.querySelector('.rd-hero-copy h1')
const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.id='orange-bubbles-lab'
Object.assign(canvas.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'8'})
document.body.append(canvas)
const ctx=canvas.getContext('2d'),emitter=createEmitter()
const desktop=matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)')
const bar=document.createElement('aside')
bar.setAttribute('aria-label','Prueba local de burbujas')
bar.innerHTML='<span>PRUEBA LOCAL · Burbujas cítricas</span><button type="button">Ver un gesto de ejemplo</button><small>Mueve rápido el ratón por el orbe hacia el titular. La web pública no cambia.</small>'
Object.assign(bar.style,{position:'fixed',bottom:'12px',left:'50%',transform:'translateX(-50%)',zIndex:'20',display:'flex',alignItems:'center',gap:'16px',padding:'10px 16px',border:'1px solid #ff9a4660',borderRadius:'14px',background:'#16120ef0',color:'#fff4e6',font:'12px/1.4 system-ui',maxWidth:'calc(100% - 24px)',boxSizing:'border-box'})
const button=bar.querySelector('button')
Object.assign(button.style,{background:'#ff9a461c',border:'1px solid #ff9a4670',color:'#ffca92',padding:'10px 14px',borderRadius:'20px',cursor:'pointer',minHeight:'44px',whiteSpace:'nowrap'})
document.body.append(bar)
let frame=0,letters=[],orbRect=null,heroRect=null
function enabled(){return desktop.matches&&!reduced.matches&&!document.hidden&&heroRect?.bottom>0&&heroRect?.top<innerHeight}
function measure(){
 const dpr=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr)
 canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.setTransform(dpr,0,0,dpr,0,0)
 heroRect=hero.getBoundingClientRect();orbRect=orb.getBoundingClientRect();letters=[]
 const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT)
 for(let node=walker.nextNode();node;node=walker.nextNode())for(let i=0;i<node.length;i++){
  if(!node.textContent[i].trim())continue
  const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1)
  const r=range.getBoundingClientRect();letters.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom})
 }
 button.disabled=!enabled();button.style.opacity=enabled()?'1':'.5'
}
function stop(){cancelAnimationFrame(frame);frame=0;emitter.clear();ctx.clearRect(0,0,innerWidth,innerHeight)}
function paint(now){
 frame=0;if(!enabled()){stop();return}
 emitter.tick(now,letters);ctx.clearRect(0,0,innerWidth,innerHeight)
 for(const p of emitter.particles){
  const r=p.radius*(p.hit===null?1:1+(now-p.hit)/700)
  ctx.globalAlpha=p.alpha
  const glow=ctx.createRadialGradient(p.x,p.y,r*.65,p.x,p.y,r*2.4)
  glow.addColorStop(0,`hsla(${p.hue},100%,58%,.26)`);glow.addColorStop(1,`hsla(${p.hue},100%,58%,0)`)
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,r*2.4,0,Math.PI*2);ctx.fill()
  ctx.strokeStyle=`hsl(${p.hue},100%,65%)`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke()
  ctx.fillStyle=`hsla(${p.hue},100%,55%,.1)`;ctx.fill()
  ctx.strokeStyle='#ffe8b6';ctx.lineWidth=.9;ctx.beginPath();ctx.arc(p.x-r*.12,p.y-r*.12,r*.66,Math.PI*1.1,Math.PI*1.48);ctx.stroke()
 }
 ctx.globalAlpha=1
 if(emitter.particles.length)frame=requestAnimationFrame(paint)
}
function wake(){if(!frame&&emitter.particles.length)frame=requestAnimationFrame(paint)}
addEventListener('pointermove',event=>{
 if(event.pointerType!=='mouse'||!enabled())return
 const cx=orbRect.left+orbRect.width/2,cy=orbRect.top+orbRect.height/2,r=Math.min(orbRect.width,orbRect.height)*.35
 const inside=Math.hypot(event.clientX-cx,event.clientY-cy)<r
 emitter.move(event.clientX,event.clientY,event.timeStamp,inside);wake()
},{passive:true})
button.addEventListener('click',()=>{
 if(!enabled())return
 const now=performance.now(),x=orbRect.left+orbRect.width*.5,y=orbRect.top+orbRect.height*.5
 emitter.clear();emitter.move(x+80,y+10,now-40,true);emitter.move(x,y,now,true);wake()
})
addEventListener('resize',()=>{stop();measure()},{passive:true})
addEventListener('scroll',()=>{stop();measure()},{passive:true})
addEventListener('blur',stop)
document.addEventListener('visibilitychange',()=>{stop();measure()})
for(const query of [desktop,reduced])query.addEventListener('change',()=>{stop();measure()})
await document.fonts.ready;measure()
new ResizeObserver(measure).observe(hero)
