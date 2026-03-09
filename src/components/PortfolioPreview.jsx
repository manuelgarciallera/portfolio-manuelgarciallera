/* eslint-disable */
'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ══════════════════════════════════════════════════════════════════════════════
// SAVED FOR INDIVIDUAL SECTION PAGES (not rendered on home):
// - SectionUXUI effect: fluid particles (organic human-feel network)
// - SectionFullStack effect: constellation with vertex connections
// These effects ARE rendered here inside SectionBlock components on home,
// but the full individual pages will be built separately.
// ══════════════════════════════════════════════════════════════════════════════

// ─── SPHERE SHADER ───────────────────────────────────────────────────────────
const SV=`uniform float uTime;varying vec3 vN;varying vec3 vP;varying float vNoise;
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tiSq(vec4 r){return 1.79284291-.85373472*r;}
float sn(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=tiSq(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 mv=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);mv=mv*mv;
return 42.*dot(mv*mv,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
void main(){vN=normalize(normalMatrix*normal);vP=position;float n=sn(position*1.2+uTime*.18);vNoise=n;
gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*n*.42,1.);}`;
const SF=`uniform float uTime;varying vec3 vN;varying vec3 vP;varying float vNoise;
void main(){float fr=pow(1.-max(dot(vN,vec3(0.,0.,1.)),0.),2.);
vec3 b=vec3(.008,.065,.1);vec3 t=vec3(.14,.54,.58);vec3 hi=vec3(.85,.97,.99);
float tv=vP.y*.5+.5;vec3 col=mix(b,t,tv*.72);
float ir=sin(vP.y*4.+vP.x*2.+uTime*.4)*.5+.5;col=mix(col,vec3(.18,.08,.32),ir*.15*(1.-tv));
col+=fr*hi*.55+fr*fr*vec3(.38,.72,.84)*.22+vNoise*.04*t;
gl_FragColor=vec4(clamp(col,0.,1.),.88+fr*.05);}`;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS=`
.p *{box-sizing:border-box;margin:0;padding:0;}
.p{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif;}
.p ::-webkit-scrollbar{width:4px;}
.p ::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:2px;}

/* ── GRADIENTS ── */
/* Dark bg: white → teal light */
.acc-dk{background:linear-gradient(90deg,#d7efe9 0%,#cbe8e2 18%,#87b5bd 57%,#4b6d85 100%);background-repeat:no-repeat;background-size:100% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;-webkit-box-decoration-break:clone;box-decoration-break:clone;}
/* Light bg: near-black → teal dark (readable, professional) */
.acc-lt{background:linear-gradient(90deg,#d3ebe6 0%,#bfe2dc 18%,#7eaeb8 57%,#456985 100%);background-repeat:no-repeat;background-size:100% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;-webkit-box-decoration-break:clone;box-decoration-break:clone;}

/* ── SCROLL REVEALS ── */
.rv{opacity:0;transform:translateY(80px);transition:opacity 1.4s cubic-bezier(.16,1,.3,1),transform 1.4s cubic-bezier(.16,1,.3,1);will-change:transform,opacity;}
.rv.in{opacity:1;transform:translateY(0);}
.rv2{opacity:0;transform:translateY(52px);transition:opacity 1.1s cubic-bezier(.16,1,.3,1),transform 1.1s cubic-bezier(.16,1,.3,1);}
.rv2.in{opacity:1;transform:translateY(0);}
.rs{opacity:0;transform:scale(.93) translateY(36px);transition:opacity 1.25s cubic-bezier(.16,1,.3,1),transform 1.25s cubic-bezier(.16,1,.3,1);}
.rs.in{opacity:1;transform:scale(1) translateY(0);}
.rl{opacity:0;transform:translateX(-56px);transition:opacity 1.2s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1);}
.rl.in{opacity:1;transform:translateX(0);}
.rr{opacity:0;transform:translateX(56px);transition:opacity 1.2s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1);}
.rr.in{opacity:1;transform:translateX(0);}
/* Clip reveal: title emerges upward */
.clip-rv{clip-path:inset(0 0 110% 0);transition:clip-path 1.15s cubic-bezier(.16,1,.3,1);}
.clip-rv.in{clip-path:inset(0 0 0% 0);}

/* ── NAVBAR — exacto Apple ── */
.nl{
  text-decoration:none;font-size:13.5px;font-weight:400;letter-spacing:-.01em;
  display:flex;align-items:center;height:100%;position:relative;
  padding:0;margin-right:24px;cursor:pointer;
  /* Hover rápido */
  transition:color .1s ease;
}
.nl .nl-bar{
  position:absolute;bottom:0;left:0;right:0;height:2.5px;border-radius:1px;
  transform:scaleX(0);transition:transform .2s cubic-bezier(.16,1,.3,1);transform-origin:left;
}
.nl.active .nl-bar{transform:scaleX(1);}

/* Dark mode nav */
.nl-dk{color:#6e6e73;}
.nl-dk.active{color:#fff!important;font-weight:600;}
.nl-dk:not(.active):hover{color:rgba(255,255,255,.85)!important;}

/* Light mode nav — FIXED: active = dark, hover = dark blue */
.nl-lt{color:#6e6e73;}
.nl-lt.active{color:#1d1d1f!important;font-weight:600;}
.nl-lt:not(.active):hover{color:#0d2a4a!important;}

/* ── BUTTONS — cápsulas limpias ── */
.btn-blue{
  background:#0071e3;color:#fff;border:none;padding:13px 28px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;letter-spacing:-.015em;
  transition:background .15s,transform .15s,box-shadow .15s;
}
.btn-blue:hover{background:#0077ed;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,113,227,.32);}
.btn-blue:active{transform:translateY(0);}

.btn-dk{
  background:#2c2c2e;color:#f5f5f7;border:none;padding:13px 28px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;letter-spacing:-.015em;
  transition:background .15s,transform .15s,box-shadow .15s;
}
.btn-dk:hover{background:#3a3a3c;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.28);}

.btn-lt{
  background:#e8e8ed;color:#1d1d1f;border:none;padding:13px 28px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;letter-spacing:-.015em;
  transition:background .15s,transform .15s;
}
.btn-lt:hover{background:#d2d2d7;transform:translateY(-2px);}

/* Ghost buttons — visibles en cualquier fondo */
.btn-ghost-dk{
  background:transparent;color:#f5f5f7;
  border:1.5px solid rgba(255,255,255,.32);
  padding:12px 27px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:400;cursor:pointer;letter-spacing:-.015em;
  transition:border-color .15s,background .15s,transform .15s;
}
.btn-ghost-dk:hover{border-color:rgba(255,255,255,.58);background:rgba(255,255,255,.08);transform:translateY(-2px);}

.btn-ghost-lt{
  background:transparent;color:#1d1d1f;
  border:1.5px solid rgba(0,0,0,.25);
  padding:12px 27px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:400;cursor:pointer;letter-spacing:-.015em;
  transition:border-color .15s,background .15s,transform .15s;
}
.btn-ghost-lt:hover{border-color:rgba(0,0,0,.45);background:rgba(0,0,0,.05);transform:translateY(-2px);}

/* Social buttons — always visible pill with icon */
.btn-social{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.1);color:#f5f5f7;
  border:1.5px solid rgba(255,255,255,.2);
  padding:10px 20px;border-radius:980px;
  font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;letter-spacing:-.01em;
  transition:background .15s,border-color .15s,transform .15s;
}
.btn-social:hover{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.4);transform:translateY(-2px);}
.btn-social-lt{
  background:rgba(0,0,0,.06);color:#1d1d1f;
  border-color:rgba(0,0,0,.2);
}
.btn-social-lt:hover{background:rgba(0,0,0,.1);border-color:rgba(0,0,0,.35);}

/* ── TABS ── */
.tab-row{display:flex;border-bottom:1.5px solid rgba(255,255,255,.08);}
.tab-row-lt{border-bottom-color:rgba(0,0,0,.1);}
.tab-btn{background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:14px;
  font-weight:400;letter-spacing:-.01em;padding:13px 0;margin-right:28px;position:relative;transition:color .1s;}
.tab-btn::after{content:'';position:absolute;bottom:-1.5px;left:0;right:0;height:2.5px;border-radius:1px;transform:scaleX(0);transition:transform .25s cubic-bezier(.16,1,.3,1);}
.tab-dk-a{color:#fff!important;font-weight:500;}
.tab-dk-a::after{transform:scaleX(1)!important;background:#fff!important;}
.tab-lt-a{color:#1d1d1f!important;font-weight:500;}
.tab-lt-a::after{transform:scaleX(1)!important;background:#1d1d1f!important;}

/* ── CARDS ── */
.card-dk{background:#1c1c1e;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:transform .55s cubic-bezier(.16,1,.3,1),box-shadow .55s;}
.card-dk:hover{transform:translateY(-10px);box-shadow:0 34px 68px rgba(0,0,0,.6);}
.card-lt{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.07),0 0 0 1px rgba(0,0,0,.04);cursor:pointer;transition:transform .55s cubic-bezier(.16,1,.3,1),box-shadow .55s;}
.card-lt:hover{transform:translateY(-10px);box-shadow:0 28px 56px rgba(0,0,0,.13),0 0 0 1px rgba(0,0,0,.04);}

/* ── COMPARISON ── */
.comp-knob{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 18px rgba(0,0,0,.38);}

.sec-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;}
.sec-canvas-interactive{position:absolute;inset:0;width:100%;height:100%;pointer-events:auto;z-index:0;}

@keyframes ppulse{0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.12);}}
@keyframes pscroll{0%,100%{transform:translateY(0);}60%{transform:translateY(10px);}}
@keyframes pfade{from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:translateY(0);}}
@keyframes nearPop{
  0%{opacity:0;transform:translateY(0) scaleX(.36) scaleY(.22);filter:blur(6px);border-radius:999px;}
  64%{opacity:1;transform:translateY(0) scaleX(1.04) scaleY(1.03);filter:blur(0);border-radius:22px;}
  100%{opacity:1;transform:translateY(0) scaleX(1) scaleY(1);filter:blur(0);border-radius:18px;}
}
@keyframes nearMediaIn{from{opacity:.2;transform:scale(1.08) rotate(-1.1deg);}to{opacity:1;transform:scale(1) rotate(0deg);}}
@keyframes nearChipPulse{0%{transform:scale(1);}52%{transform:scale(1.055);}100%{transform:scale(1);}}
@media(max-width:700px){.hide-m{display:none!important;}}
`;

// ─── SVG ─────────────────────────────────────────────────────────────────────
const ChR=({s=13,c="#fff"})=><svg width={s} height={s} viewBox="0 0 13 13" fill="none"><path d="M4.5 2.5l4 4-4 4" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChL=({s=13,c="#fff"})=><svg width={s} height={s} viewBox="0 0 13 13" fill="none"><path d="M8.5 2.5l-4 4 4 4" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChU=({s=12,c="#fff"})=><svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2.4 7.6l3.6-3.6 3.6 3.6" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChD=({s=12,c="#fff"})=><svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2.4 4.4L6 8l3.6-3.6" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoLI=({c="#fff"})=><svg width="14" height="14" viewBox="0 0 24 24" fill={c}><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2" fill={c}/></svg>;
const IcoGH=({c="#fff"})=><svg width="14" height="14" viewBox="0 0 24 24" fill={c}><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>;

// ─── SMART IMAGE ─────────────────────────────────────────────────────────────
const IMGS=["https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=75&auto=format","https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=75&auto=format","https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=75&auto=format","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=75&auto=format"];
const FBK=["linear-gradient(135deg,#0a1628,#1a3a5c)","linear-gradient(135deg,#0a1a18,#0e3530)","linear-gradient(135deg,#0d0d1a,#1a1a32)","linear-gradient(135deg,#1a1020,#2d1a3e)"];
const HERO_GALLERY_AUTOPLAY_MS=5000;
const HERO_GALLERY_GRID_MIN=24;
const HERO_GALLERY=[
  {k:"chips",title:"M5, M5 Pro y M5 Max.\nUna familia con mucho poder."},
  {k:"image",title:"Una potente plataforma para la inteligencia artificial.\nCon una mente maravillosa.",src:"https://images.unsplash.com/photo-1517232115160-ff93364542dd?w=1600&q=80&auto=format",zoom:true},
  {k:"image",title:"App Telefono. Sigue en contacto sin tocar el movil.",src:"https://images.unsplash.com/photo-1517959105821-eaf2591984f8?w=1600&q=80&auto=format"},
  {k:"image",title:"Rendimiento de estudio para flujos visuales en tiempo real.",src:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80&auto=format",zoom:true},
  {k:"image",title:"Bateria para jornadas largas. Rapido cuando lo necesitas.",src:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=80&auto=format"}
];
const CLOSE_LOOK_ITEMS=[
  {
    label:"Diseño UX/UI",
    desc:"Arquitecturas de experiencia y sistemas visuales con foco en claridad, conversion y producto digital.",
    src:"https://images.unsplash.com/photo-1487014679447-9f8336841d58?w=1700&q=80&auto=format"
  },
  {
    label:"Diseño Arquitectónico",
    desc:"Modelado de espacios, narrativa visual y presentaciones inmersivas para proyectos arquitectonicos.",
    src:"https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1700&q=80&auto=format"
  },
  {
    label:"Diseño 3D",
    desc:"Pipelines de 3D realtime, optimizacion de escenas y visualizacion con motion controlado.",
    src:"https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?w=1700&q=80&auto=format"
  },
  {
    label:"Research",
    desc:"Entrevistas, pruebas y sintesis para transformar señales de usuario en decisiones de producto.",
    src:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1700&q=80&auto=format"
  },
  {
    label:"Investigación docente",
    desc:"Diseño de materiales, experimentacion y aprendizaje aplicado a tecnologia, UX y desarrollo.",
    src:"https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1700&q=80&auto=format"
  },
  {
    label:"Diseño gráfico",
    desc:"Identidad, composicion tipografica y piezas visuales con criterio editorial y consistencia de marca.",
    src:"https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?w=1700&q=80&auto=format"
  },
  {
    label:"Desarrollo Front",
    desc:"Interfaces web performantes, accesibles y animadas con arquitectura modular orientada a producto.",
    src:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1700&q=80&auto=format"
  },
  {
    label:"Desarrollo Back",
    desc:"APIs robustas, integraciones y modelado de datos para escalar funcionalidades de forma fiable.",
    src:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1700&q=80&auto=format"
  },
];
function Img({src,fb,alt,style={}}){
  const [e,setE]=useState(false);
  if(e)return <div style={{width:"100%",height:"100%",background:fb,...style}}/>;
  return <img src={src} alt={alt} loading="lazy" onError={()=>setE(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",...style}}/>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Portfolio(){
  const [theme,setTheme]=useState("dark");
  const [scrolled,setScrolled]=useState(false);
  const [activeNav,setActiveNav]=useState("Trabajo");
  const wrapRef=useRef(null);
  const canvasRef=useRef(null);
  const isDark=theme==="dark";
  const prefRM=useRef(typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion:reduce)").matches);

  useEffect(()=>{const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  useEffect(()=>{
    const el=wrapRef.current;if(!el)return;
    const fn=()=>setScrolled(el.scrollTop>50);
    el.addEventListener("scroll",fn,{passive:true});return()=>el.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    const el=wrapRef.current;if(!el)return;
    const io=new IntersectionObserver(
      e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add("in");}),
      {threshold:.04,rootMargin:"0px 0px -40px 0px",root:el}
    );
    setTimeout(()=>el.querySelectorAll(".rv,.rv2,.rs,.rl,.rr,.clip-rv").forEach(x=>io.observe(x)),150);
    return()=>io.disconnect();
  },[]);

  // Hero Three.js
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(55,1,.1,100);camera.position.z=4.5;
    const sGeo=new THREE.SphereGeometry(1.4,96,96);
    const sMat=new THREE.ShaderMaterial({vertexShader:SV,fragmentShader:SF,uniforms:{uTime:{value:0}},transparent:true});
    const sphere=new THREE.Mesh(sGeo,sMat);scene.add(sphere);
    const rings=[];
    [[2.2,.005,.12,Math.PI/2.8],[2.65,.004,.07,Math.PI/4]].forEach(([r,t,o,rx])=>{
      const g=new THREE.TorusGeometry(r,t,8,140);
      const m=new THREE.MeshBasicMaterial({color:0x5ec4c8,transparent:true,opacity:o});
      const ring=new THREE.Mesh(g,m);ring.rotation.x=rx;scene.add(ring);rings.push(ring);
    });
    // Afterimage trail
    const trail=[];
    for(let i=0;i<5;i++){
      const tg=new THREE.SphereGeometry(1.4,32,32);
      const tm=new THREE.ShaderMaterial({vertexShader:SV,fragmentShader:SF,uniforms:{uTime:{value:0}},transparent:true});
      const mesh=new THREE.Mesh(tg,tm);mesh.visible=false;scene.add(mesh);trail.push({mesh,mat:tm,o:i});
    }
    const COUNT=260,pos=new Float32Array(COUNT*3);
    for(let i=0;i<COUNT;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=2.2+Math.random()*2.6;pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.sin(ph)*Math.sin(th);pos[i*3+2]=r*Math.cos(ph);}
    const pGeo=new THREE.BufferGeometry();pGeo.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const pMat=new THREE.PointsMaterial({color:0x8adde0,size:.032,transparent:true,opacity:.32,sizeAttenuation:true});
    const pts=new THREE.Points(pGeo,pMat);scene.add(pts);
    const mouse={tx:0,ty:0,x:0,y:0};
    const onM=e=>{const r=canvas.getBoundingClientRect();mouse.tx=((e.clientX-r.left)/r.width-.5)*1.6;mouse.ty=-((e.clientY-r.top)/r.height-.5)*1.2;};
    canvas.addEventListener("mousemove",onM,{passive:true});
    const resize=()=>{const w=canvas.offsetWidth,h=canvas.offsetHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
    let t=0,fr=0;const hist=[];for(let i=0;i<6;i++)hist.push({x:0,y:0,ry:0,rx:0,sc:1});
    let raf;
    const tick=()=>{raf=requestAnimationFrame(tick);t+=.009;fr++;
      if(!prefRM.current){
        mouse.x+=(mouse.tx-mouse.x)*.042;mouse.y+=(mouse.ty-mouse.y)*.042;
        sMat.uniforms.uTime.value=t;
        sphere.rotation.y+=.0032;sphere.rotation.x+=.0007;
        sphere.position.x+=(mouse.x*.34-sphere.position.x)*.038;sphere.position.y+=(mouse.y*.24-sphere.position.y)*.038;
        rings[0].rotation.z+=.0014;rings[1].rotation.z-=.001;pts.rotation.y+=.0004;
        sphere.scale.setScalar(Math.sin(t*.7)*.04+1);
        if(fr%2===0){hist.unshift({x:sphere.position.x,y:sphere.position.y,ry:sphere.rotation.y,rx:sphere.rotation.x,sc:sphere.scale.x});hist.pop();}
        trail.forEach((tm,i)=>{const h=hist[Math.min(i+1,hist.length-1)];tm.mesh.position.x=h.x;tm.mesh.position.y=h.y;tm.mesh.rotation.y=h.ry;tm.mesh.rotation.x=h.rx;tm.mesh.scale.setScalar(h.sc);tm.mat.uniforms.uTime.value=t-(tm.o*.08);tm.mat.opacity=(5-i)*.026;tm.mesh.visible=true;});
      }
      renderer.render(scene,camera);
    };tick();
    return()=>{cancelAnimationFrame(raf);[sGeo,sMat,pGeo,pMat].forEach(x=>x.dispose());rings.forEach(r=>{r.geometry.dispose();r.material.dispose();});trail.forEach(t=>{t.mesh.geometry.dispose();t.mat.dispose();});renderer.dispose();ro.disconnect();canvas.removeEventListener("mousemove",onM);};
  },[]);

  const C=isDark?{
    bg:"#000",bgSec:"#0a0a0b",bgAlt:"#111114",
    card:"#1c1c1e",border:"rgba(255,255,255,0.07)",
    text:"#f5f5f7",textSec:"#86868b",
    nav:"#1d1d1f",navBorder:"rgba(255,255,255,0.1)",teal:"#5ec4c8",
    ctaBg:"#f5f5f7",ctaText:"#1d1d1f",ctaTextSec:"#6e6e73",
    statBg:"#1c1c1e",divider:"rgba(255,255,255,0.07)",
  }:{
    bg:"#fff",bgSec:"#f5f5f7",bgAlt:"#fff",
    card:"#fff",border:"rgba(0,0,0,0.0)",
    text:"#1d1d1f",textSec:"#6e6e73",
    nav:"rgba(255,255,255,0.94)",navBorder:"rgba(0,0,0,0.1)",teal:"#0e6b6b",
    ctaBg:"#1d1d1f",ctaText:"#f5f5f7",ctaTextSec:"#86868b",
    statBg:"#fff",divider:"rgba(0,0,0,0.07)",
  };

  const NAVLINKS=["Trabajo","3D","Sobre mí","Contacto"];

  return(
    <div ref={wrapRef} className="p" style={{height:"100vh",overflowY:"scroll",overflowX:"hidden",background:C.bg,color:C.text,transition:"background .5s,color .35s",scrollbarWidth:"thin"}}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:"sticky",top:0,zIndex:200,height:52,
        display:"flex",alignItems:"stretch",justifyContent:"space-between",
        padding:"0 24px",animation:"pfade .4s ease",
        background:isDark?"#1d1d1f":C.nav,
        backdropFilter:!isDark?"blur(20px) saturate(180%)":"none",
        WebkitBackdropFilter:!isDark?"blur(20px) saturate(180%)":"none",
        borderBottom:`1px solid ${C.navBorder}`,
        transition:"background .25s,border-color .25s",
      }}>
        <div style={{display:"flex",alignItems:"center"}}>
          <span style={{fontSize:15,fontWeight:600,letterSpacing:"-.04em",color:isDark?"#f5f5f7":"#1d1d1f"}}>Manuel García Llera</span>
        </div>

        <div className="hide-m" style={{display:"flex",alignItems:"stretch",position:"absolute",left:"50%",transform:"translateX(-50%)",height:"100%"}}>
          {NAVLINKS.map(l=>(
            <a key={l} onClick={()=>setActiveNav(l)}
               className={`nl ${isDark?"nl-dk":"nl-lt"}${activeNav===l?" active":""}`}>
              {l}
              <span className="nl-bar" style={{background:isDark?"#fff":"#1d1d1f"}}/>
            </a>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="hide-m" style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:980,border:`1px solid ${C.teal}55`,background:`${C.teal}12`,fontSize:12,color:C.teal,fontWeight:500,letterSpacing:"-.01em"}}>
            <span style={{width:5.5,height:5.5,borderRadius:"50%",background:C.teal,display:"inline-block",animation:"ppulse 2.2s infinite"}}/>
            Disponible
          </div>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}
            className={isDark?"btn-dk":"btn-lt"}
            style={{fontSize:12.5,padding:"6px 14px"}}>
            {isDark?"☀️ Claro":"🌙 Oscuro"}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{height:"100dvh",minHeight:620,position:"relative",marginTop:-52,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#000"}}>
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 65% 55% at 50% 40%,rgba(94,196,200,.034) 0%,transparent 65%)",pointerEvents:"none"}}/>

        <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"0 24px",maxWidth:980,width:"100%"}}>
          <p style={{fontSize:13.5,color:"rgba(255,255,255,.62)",letterSpacing:".015em",marginBottom:20,fontWeight:400}}>
            Portfolio · Manuel García Llera
          </p>
          <h1 style={{fontSize:"clamp(50px,8.5vw,98px)",fontWeight:700,lineHeight:1.03,letterSpacing:"-.048em",marginBottom:6}}>
            <span style={{display:"block",color:"#fff"}}>Diseño que</span>
            <span style={{display:"block",color:"#fff"}}>piensa en <span className="acc-dk">código.</span></span>
          </h1>
          <p style={{fontSize:"clamp(17px,1.9vw,20px)",color:"rgba(255,255,255,.7)",lineHeight:1.58,maxWidth:500,margin:"28px auto 44px",fontWeight:400,letterSpacing:"-.015em"}}>
            Visual Design Manager en LALIGA.<br/>UX, producto, 3D arquitectónico y full stack.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn-blue">Ver proyectos</button>
            <button className="btn-ghost-dk">Más sobre mí</button>
          </div>
        </div>

        <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
          <div style={{width:20,height:32,borderRadius:10,border:"1.5px solid rgba(255,255,255,.18)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:4}}>
            <div style={{width:3,height:7,borderRadius:2,background:"rgba(255,255,255,.3)",animation:"pscroll 2.2s infinite ease-in-out"}}/>
          </div>
        </div>
      </section>

      {/* ── FEATURED ── */}
      <HeroGallerySection isDark={isDark} C={C} prefRM={prefRM}/> 
      <CloseLookSection isDark={isDark} C={C} prefRM={prefRM}/>

      <FeaturedSection isDark={isDark} C={C}/>

      {/* ── SECTION BLOCK: 3D ARQUITECTURA ── */}
      <ArchSection isDark={isDark} C={C} prefRM={prefRM}/>

      {/* ── MINI PROJECTS — visual separator ── */}
      <MiniProjects isDark={isDark} C={C} projects={[PROJECTS[0],PROJECTS[1],PROJECTS[2]]}/>

      {/* ── SECTION BLOCK: UX / PRODUCT DESIGN ── */}
      <UXSection isDark={isDark} C={C} prefRM={prefRM}/>

      {/* ── MINI PROJECTS — separator ── */}
      <MiniProjects isDark={isDark} C={C} projects={[PROJECTS[3],PROJECTS[0],PROJECTS[1]]} alt/>

      {/* ── SECTION BLOCK: FULL STACK ── */}
      <FullStackSection isDark={isDark} C={C} prefRM={prefRM}/>

      {/* ── DEVICE ── */}
      <DeviceSection isDark={isDark} C={C} wrapRef={wrapRef} prefRM={prefRM}/>

      {/* ── COMPARISON ── */}
      <ComparisonSection isDark={isDark} C={C}/>

      {/* ── CTA ── */}
      <section style={{padding:"150px 28px",textAlign:"center",background:C.ctaBg,transition:"background .5s"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <p className="rv" style={{fontSize:12,color:C.ctaTextSec,letterSpacing:".1em",textTransform:"uppercase",fontWeight:500,marginBottom:22}}>Contacto</p>
          <h2 className="rv" style={{transitionDelay:".14s",fontSize:"clamp(34px,6vw,68px)",fontWeight:700,letterSpacing:"-.046em",lineHeight:1.02,marginBottom:20,color:C.ctaText}}>
            Construyamos algo{" "}
            {/* Gradient adapts to background: dark bg (light mode) → white/teal; light bg (dark mode) → dark/teal */}
            <span className={isDark?"acc-lt":"acc-dk"}>extraordinario.</span>
          </h2>
          <p className="rv" style={{transitionDelay:".26s",fontSize:17,lineHeight:1.65,marginBottom:44,fontWeight:400,color:C.ctaTextSec}}>
            Disponible para proyectos de diseño, producto y 3D arquitectónico.
          </p>
          <div className="rv" style={{transitionDelay:".38s",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",alignItems:"center"}}>
            <button className="btn-blue" style={{padding:"13px 28px"}}>Contactar →</button>
            {/* CTA bg es INVERTIDO al tema: dark mode = fondo claro, light mode = fondo oscuro */}
            <button className={`btn-social${isDark?" btn-social-lt":""}`}>
              <IcoLI c={isDark?"#1d1d1f":"#f5f5f7"}/> LinkedIn
            </button>
            <button className={`btn-social${isDark?" btn-social-lt":""}`}>
              <IcoGH c={isDark?"#1d1d1f":"#f5f5f7"}/> GitHub
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── FEATURED ─────────────────────────────────────────────────────────────────
function FeaturedSection({isDark,C}){
  const [active,setActive]=useState(0);
  const imgRef=useRef(null);
  const items=[
    {label:"UX · LALIGA",cat:"Product Design",headline:"Diseño de",accent:"producto.",sub:"Experiencias digitales para 20 millones de seguidores en todo el mundo.",src:IMGS[0],fb:FBK[0]},
    {label:"3D · Estadios",cat:"3D Visualization",headline:"Arquitectura",accent:"fotorrealista.",sub:"Modelos SketchUp, visualización en UE5 y rendering web interactivo.",src:IMGS[1],fb:FBK[1]},
    {label:"Full Stack",cat:"Development",headline:"Del diseño al",accent:"código.",sub:"Angular, Node.js y MongoDB. Interfaces que funcionan en producción real.",src:IMGS[2],fb:FBK[2]},
    {label:"Branding",cat:"Brand Design",headline:"Identidad visual de",accent:"marca.",sub:"Sistemas de diseño coherentes para entidades del deporte global.",src:IMGS[3],fb:FBK[3]},
  ];
  const go=i=>{if(i===active)return;const el=imgRef.current;if(el){el.style.opacity="0";el.style.transform="scale(1.025)";}setTimeout(()=>{setActive(i);if(el){el.style.transition="opacity .55s ease,transform .65s ease";el.style.opacity="1";el.style.transform="scale(1)";}},160);};
  const cur=items[active];
  return(
    <section style={{background:isDark?"#0a0a0b":"#f5f5f7",transition:"background .5s"}}>
      <div style={{maxWidth:980,margin:"0 auto",padding:"96px 28px 56px"}}>
        <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:18}}>Proyectos seleccionados</p>
        <h2 className="rv" style={{transitionDelay:".12s",fontSize:"clamp(34px,5.2vw,64px)",fontWeight:700,letterSpacing:"-.042em",lineHeight:1.03}}>
          <span className={isDark?"acc-dk":"acc-lt"}>El trabajo habla por sí solo.</span>
        </h2>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px"}}>
        <div style={{borderRadius:"20px 20px 0 0",overflow:"hidden",position:"relative",height:"clamp(320px,52vw,600px)"}}>
          <div ref={imgRef} style={{width:"100%",height:"100%",transition:"none"}}><Img src={cur.src} fb={cur.fb} alt={cur.label}/></div>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.82) 0%,rgba(0,0,0,.04) 55%,transparent 100%)"}}/>
          <div style={{position:"absolute",bottom:34,left:38,right:38}}>
            <div style={{fontSize:10.5,color:"rgba(255,255,255,.44)",letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>{cur.cat}</div>
            <h3 style={{fontSize:"clamp(20px,3.2vw,38px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.08,color:"#fff",marginBottom:10}}>{cur.headline} <span style={{color:"#5ec4c8"}}>{cur.accent}</span></h3>
            <p style={{fontSize:"clamp(13px,1.4vw,15px)",color:"rgba(255,255,255,.52)",maxWidth:520,lineHeight:1.52}}>{cur.sub}</p>
          </div>
          <div style={{position:"absolute",bottom:38,left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:6,background:"rgba(0,0,0,.42)",backdropFilter:"blur(8px)",padding:"8px 14px",borderRadius:980}}>
            {items.map((_,i)=><div key={i} onClick={()=>go(i)} style={{cursor:"pointer",borderRadius:980,background:"rgba(255,255,255,.72)",transition:"all .3s",width:active===i?18:6,height:6,opacity:active===i?1:.4}}/>)}
          </div>
          <div style={{position:"absolute",bottom:30,right:36,display:"flex",gap:8}}>
            {[{fn:()=>go((active-1+items.length)%items.length),I:ChL},{fn:()=>go((active+1)%items.length),I:ChR}].map(({fn,I},i)=>(
              <button key={i} onClick={fn} style={{width:42,height:42,borderRadius:"50%",border:"none",cursor:"pointer",background:"rgba(255,255,255,.14)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.26)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.14)"}><I/></button>
            ))}
          </div>
        </div>
        <div style={{background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.025)",borderRadius:"0 0 20px 20px",borderStyle:"solid",borderColor:isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)",borderWidth:"0 1px 1px 1px",padding:"0 28px"}}>
          <div className={`tab-row${!isDark?" tab-row-lt":""}`}>
            {items.map((item,i)=>(
              <button key={item.label} onClick={()=>go(i)}
                className={`tab-btn ${active===i?(isDark?"tab-dk-a":"tab-lt-a"):""}`}
                style={{color:active===i?C.text:C.textSec}}>{item.label}</button>
            ))}
          </div>
          <p style={{fontSize:13.5,color:C.textSec,lineHeight:1.58,padding:"16px 0 22px",maxWidth:680}}>{cur.sub}</p>
        </div>
      </div>
    </section>
  );
}

// ─── ARCH SECTION — drawrange wireframe ───────────────────────────────────────
function HeroGallerySection({isDark,C,prefRM}){
  const [active,setActive]=useState(0);
  const [playing,setPlaying]=useState(false);
  const frameRef=useRef(null);
  const [w,setW]=useState(1200);
  const n=HERO_GALLERY.length;

  useEffect(()=>{
    const el=frameRef.current;if(!el)return;
    const measure=()=>setW(el.clientWidth||1200);
    measure();
    const ro=new ResizeObserver(measure);ro.observe(el);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    if(prefRM.current&&playing)setPlaying(false);
  },[playing,prefRM]);

  useEffect(()=>{
    if(!playing||prefRM.current)return;
    const first=setTimeout(()=>setActive(v=>(v+1)%n),900);
    const id=setInterval(()=>setActive(v=>(v+1)%n),HERO_GALLERY_AUTOPLAY_MS);
    return()=>{clearTimeout(first);clearInterval(id);};
  },[playing,prefRM,n]);

  const gap=w<760?10:22;
  const slideW=w<760?Math.max(304,w*.93):Math.min(1280,Math.max(1030,w*.68));
  const slideH=w<760?438:686;
  const tx=((w-slideW)/2)-(active*(slideW+gap));
  const controlH=58;
  const leadX=Math.max(0,(w-slideW)/2);

  return(
    <section style={{padding:"132px 0 0",background:isDark?"#1c1c24":"#f0f0f3",transition:"background .5s",minHeight:"84vh"}}>
      <div style={{width:"100vw",position:"relative",left:"50%",transform:"translateX(-50%)"}}>
        <h2 className={isDark?"acc-dk":"acc-lt"} style={{fontSize:"clamp(34px,4vw,52px)",fontWeight:700,letterSpacing:"-.03em",lineHeight:1.04,margin:`0 0 42px ${leadX}px`}}>Lo principal.</h2>
      </div>

      <div ref={frameRef} style={{overflow:"hidden",width:"100vw",position:"relative",left:"50%",transform:"translateX(-50%)"}}>
          <div style={{display:"flex",gap,transform:`translateX(${tx}px)`,transition:"transform .72s cubic-bezier(.22,.61,.36,1)"}}>
            {HERO_GALLERY.map((item,i)=>(
              <article key={`${item.title}-${i}`} style={{
                flex:"0 0 auto",
                width:slideW,
                height:slideH,
                borderRadius:30,
                overflow:"hidden",
                position:"relative",
                background:"#000",
                border:`1px solid ${isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.08)"}`,
              }}>
                <div style={{position:"absolute",left:38,top:36,zIndex:10,fontSize:"clamp(15px,1.2vw,19px)",lineHeight:1.17,fontWeight:600,letterSpacing:"-.01em",color:"#f5f5f7",maxWidth:"58%"}}>
                  {item.title.split("\n").map((line,idx)=><div key={idx}>{line}</div>)}
                </div>

                {item.k==="chips"?(
                  <div style={{position:"absolute",inset:0,display:"flex",justifyContent:"center",alignItems:"center",gap:w<760?10:20,paddingTop:w<760?44:58}}>
                    {[
                      {t:"M5",g:"linear-gradient(145deg,#03131f 0%,#083e67 32%,#58d6d3 100%)"},
                      {t:"M5 PRO",g:"linear-gradient(145deg,#080d2b 0%,#0c2d8f 45%,#69cdf7 100%)"},
                      {t:"M5 MAX",g:"linear-gradient(145deg,#130a1e 0%,#4a1492 50%,#d7a5ff 100%)"}
                    ].map((chip,idx)=>(
                      <div key={chip.t} style={{width:w<760?92:190,height:w<760?92:190,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:w<760?23:52,fontWeight:700,letterSpacing:"-.03em",color:"#d7e6ea",background:chip.g,border:"1px solid rgba(170,225,255,.75)"}}>
                        {chip.t}
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{position:"absolute",inset:0}}>
                    <Img src={item.src} fb="linear-gradient(135deg,#0d1525,#1a2740)" alt={item.title} style={{transform:active===i&&item.zoom?"scale(1.08)":"scale(1)",transition:"transform 8s cubic-bezier(.22,.61,.36,1)"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,.22) 100%)"}}/>
                  </div>
                )}
              </article>
            ))}
          </div>
      </div>

      <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:18,marginTop:72}}>
          <div style={{display:"flex",alignItems:"center",gap:12,height:controlH,padding:"0 20px",borderRadius:999,background:isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)"}}>
            {HERO_GALLERY.map((_,i)=>(
              <button key={i} aria-label={`Ir a tarjeta ${i+1}`} onClick={()=>{setActive(i);setPlaying(false);}}
                style={{border:"none",padding:0,width:active===i?50:9,height:9,borderRadius:999,background:active===i?(isDark?"#f5f5f7":"#1d1d1f"):(isDark?"rgba(255,255,255,.55)":"rgba(0,0,0,.35)"),cursor:"pointer",transition:"all .28s ease"}}/>
            ))}
          </div>
          <button onClick={()=>setPlaying(v=>!v)} aria-label={playing?"Pausar galeria":"Reproducir galeria"}
            style={{width:controlH,height:controlH,borderRadius:"50%",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",background:isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)",color:isDark?"#f5f5f7":"#1d1d1f"}}>
            {playing?"\u23F8":"\u25B6"}
          </button>
        </div>
    </section>
  );
}

function CloseLookSection({isDark,C,prefRM}){
  const [active,setActive]=useState(0);
  const [open,setOpen]=useState(-1);
  const [hovered,setHovered]=useState(-1);
  const [xHover,setXHover]=useState(false);
  const [pulseId,setPulseId]=useState(-1);
  const panelRef=useRef(null);
  const mediaRef=useRef(null);
  const pulseTimerRef=useRef(null);
  const [panelW,setPanelW]=useState(1120);
  const items=CLOSE_LOOK_ITEMS;
  const n=items.length;

  useEffect(()=>{
    const el=panelRef.current;if(!el)return;
    const measure=()=>setPanelW(el.clientWidth||1120);
    measure();
    const ro=new ResizeObserver(measure);ro.observe(el);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>()=>{if(pulseTimerRef.current)clearTimeout(pulseTimerRef.current);},[]);

  const bump=useCallback((i)=>{
    setPulseId(i);
    if(pulseTimerRef.current)clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current=setTimeout(()=>setPulseId(-1),390);
  },[]);

  const select=useCallback((i,shouldOpen=true)=>{
    const next=(i+n)%n;
    setActive(next);
    setOpen(shouldOpen?next:-1);
    bump(next);
  },[n,bump]);

  const onItem=useCallback((i)=>{
    if(open===i){setOpen(-1);setActive(i);bump(i);return;}
    select(i,true);
  },[open,select,bump]);

  const onMove=e=>{
    if(!mediaRef.current||prefRM.current||panelW<960)return;
    const r=mediaRef.current.getBoundingClientRect();
    const nx=(e.clientX-r.left)/r.width;
    const ny=(e.clientY-r.top)/r.height;
    const ry=(nx-.5)*9;
    const rx=(.5-ny)*6;
    mediaRef.current.style.transform=`scale(1.012) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onLeave=()=>{if(mediaRef.current)mediaRef.current.style.transform="scale(1) rotateX(0deg) rotateY(0deg)";};

  const wide=panelW>=980;
  const activeItem=items[active];
  const listLeft=wide?118:16;
  const listTop=wide?48:20;
  const descWidth=wide?Math.min(480,Math.max(360,panelW*.33)):0;
  const descMax=Math.max(340,panelW-listLeft-28);
  const ctrlSize=wide?36:32;

  return(
    <section style={{padding:wide?"10px 28px 170px":"26px 16px 112px",background:isDark?"#1c1c24":"#f0f0f3",transition:"background .5s"}}>
      <div style={{maxWidth:1420,margin:"0 auto"}}>
        <h2 className={isDark?"acc-dk":"acc-lt"} style={{fontSize:"clamp(34px,4vw,52px)",fontWeight:700,letterSpacing:"-.03em",lineHeight:1.04,marginBottom:42,marginLeft:wide?64:0}}>
          {"M\u00E1s de cerca."}
        </h2>

        <div ref={panelRef} style={{
          borderRadius:30,
          overflow:"hidden",
          background:"#000",
          border:"none",
          padding:0,
        }}>
          <div style={{position:"relative",minHeight:wide?800:880}}>
            <div
              key={active}
              ref={mediaRef}
              onMouseMove={onMove}
              onMouseLeave={onLeave}
              style={{
                position:"absolute",
                inset:0,
                transform:"scale(1) rotateX(0deg) rotateY(0deg)",
                transformStyle:"preserve-3d",
                transition:"transform .24s ease,box-shadow .35s ease",
                animation:prefRM.current?"none":"nearMediaIn .72s cubic-bezier(.16,1,.3,1)",
                background:"#0b0b10",
              }}>
              <Img src={activeItem.src} fb="linear-gradient(135deg,#101821,#1b293f)" alt={activeItem.label} style={{transform:"scale(1.03)",filter:"saturate(1.08) contrast(1.03)"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.12) 0%,rgba(0,0,0,.05) 46%,rgba(0,0,0,.42) 100%)"}}/>
            </div>

            <div style={{position:"absolute",inset:0,background:wide?"linear-gradient(90deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,.52) 24%,rgba(0,0,0,.2) 45%,rgba(0,0,0,.05) 70%,rgba(0,0,0,.14) 100%)":"linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.25) 38%,rgba(0,0,0,.35) 100%)",pointerEvents:"none"}}/>

            {open!==-1&&(
              <button onClick={()=>setOpen(-1)} aria-label="Cerrar descripcion"
                onMouseEnter={()=>setXHover(true)}
                onMouseLeave={()=>setXHover(false)}
                style={{position:"absolute",top:14,right:14,zIndex:15,width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",fontSize:25,fontWeight:760,lineHeight:1,background:xHover?"rgba(20,20,24,.96)":"rgba(34,34,38,.88)",color:"#d8d8df",transition:"background .24s ease"}}>
                {"\u00D7"}
              </button>
            )}

            <div style={{position:"absolute",left:listLeft,top:wide?"50%":listTop,transform:wide?"translateY(-50%)":"none",zIndex:10,width:wide?430:"calc(100% - 32px)"}}>
              {wide&&(
                <div style={{position:"absolute",left:-74,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:30}}>
                  <button onClick={()=>select(active-1,true)} aria-label="Categoria anterior"
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)"}}>
                    <ChU s={20}/>
                  </button>
                  <button onClick={()=>select(active+1,true)} aria-label="Categoria siguiente"
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)"}}>
                    <ChD s={20}/>
                  </button>
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {items.map((item,i)=>{
                  const isOn=active===i;
                  const expanded=open===i;
                  const isHover=hovered===i;
                  return(
                    <div key={item.label}>
                      {!expanded&&(
                        <button onClick={()=>onItem(i)} aria-expanded={expanded} aria-label={`${expanded?"Cerrar":"Abrir"} ${item.label}`}
                          onMouseEnter={()=>setHovered(i)}
                          onMouseLeave={()=>setHovered(-1)}
                          onFocus={()=>setHovered(i)}
                          onBlur={()=>setHovered(-1)}
                          style={{
                            width:"fit-content",
                            maxWidth:"100%",
                            border:"none",
                            background:isHover?(isOn?"rgba(39,39,44,.9)":"rgba(22,22,27,.84)"):(isOn?"rgba(47,47,54,.76)":"rgba(31,31,36,.62)"),
                            boxShadow:"none",
                            borderRadius:999,
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"flex-start",
                            gap:10,
                            cursor:"pointer",
                            padding:wide?"12px 18px":"11px 14px",
                            color:"#f5f5f7",
                            fontSize:wide?18:16,
                            fontWeight:600,
                            letterSpacing:"-.015em",
                            transition:"background .24s ease,border-color .24s ease,transform .2s ease,box-shadow .22s ease,opacity .24s ease",
                            animation:pulseId===i&&!prefRM.current?"nearChipPulse .38s cubic-bezier(.16,1,.3,1)":"none",
                            backdropFilter:"blur(6px)",
                            opacity:open===-1||!isOn?1:.65,
                          }}>
                          <span style={{
                            width:27,
                            height:27,
                            borderRadius:"50%",
                            border:"2px solid #fff",
                            display:"inline-flex",
                            alignItems:"center",
                            justifyContent:"center",
                            fontSize:22,
                            fontWeight:650,
                          color:"#fff",
                          background:isOn||isHover?"rgba(255,255,255,.14)":"transparent",
                          flexShrink:0,
                          lineHeight:1,
                        }}>
                            +
                          </span>
                          <span>{item.label}</span>
                        </button>
                      )}
                      {expanded&&(
                        <div style={{
                          marginTop:8,
                          borderRadius:18,
                          padding:wide?"14px 16px":"13px 14px",
                          width:wide?Math.min(descWidth,descMax):"100%",
                          fontSize:wide?17:15,
                          fontWeight:470,
                          lineHeight:1.47,
                          letterSpacing:"-.01em",
                          color:"rgba(245,245,247,.95)",
                          background:"rgba(34,34,40,.68)",
                          border:"none",
                          animation:prefRM.current?"none":"nearPop .92s cubic-bezier(.16,1,.3,1)",
                          transformOrigin:"center center",
                          backdropFilter:"blur(10px)",
                        }}>
                          <span style={{fontWeight:700,color:"#f5f5f7"}}>{item.label}. </span>
                          <span style={{fontWeight:470,color:"rgba(245,245,247,.94)"}}>{item.desc}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!wide&&(
                <div style={{display:"flex",gap:10,marginTop:12}}>
                  <button onClick={()=>select(active-1,true)} aria-label="Categoria anterior"
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)"}}>
                    <ChU s={20}/>
                  </button>
                  <button onClick={()=>select(active+1,true)} aria-label="Categoria siguiente"
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)"}}>
                    <ChD s={20}/>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchSection({isDark,C,prefRM}){
  const canvasRef=useRef(null);
  const secRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||prefRM.current)return;
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.set(5,3.5,7);camera.lookAt(0,0,0);
    // Ground grid
    const all=[];
    for(let i=-5;i<=5;i++){all.push(-5,0,i,5,0,i,i,0,-5,i,0,5);}
    // Arch wireframe: walls, roof, columns as line segments
    const archPts=[
      // Front wall outline
      -4,0,-4, -4,3,-4,  -4,3,-4, 4,3,-4,  4,3,-4, 4,0,-4,  4,0,-4, -4,0,-4,
      // Back wall outline
      -4,0,4, -4,3,4,  -4,3,4, 4,3,4,  4,3,4, 4,0,4,  4,0,4, -4,0,4,
      // Roof connectors
      -4,3,-4, -4,3,4,  4,3,-4, 4,3,4,
      // Floor connectors
      -4,0,-4, -4,0,4,  4,0,-4, 4,0,4,
      // Interior columns
      -3,0,-3, -3,3,-3,  3,0,-3, 3,3,-3,
      -3,0,3,  -3,3,3,   3,0,3,  3,3,3,
    ];
    const combined=[...all,...archPts];
    const totalPts=combined.length/3;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(combined,3));
    geo.setDrawRange(0,0);
    const mat=new THREE.LineBasicMaterial({color:0x5ec4c8,transparent:true,opacity:.38});
    const lines=new THREE.LineSegments(geo,mat);scene.add(lines);
    const resize=()=>{const w=canvas.offsetWidth,h=canvas.offsetHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
    let drawn=0,visible=false,t=0,raf;
    const io=new IntersectionObserver(e=>{if(e[0].isIntersecting)visible=true;},{threshold:.08});
    if(secRef.current)io.observe(secRef.current);
    const tick=()=>{raf=requestAnimationFrame(tick);t+=.007;
      if(visible&&drawn<totalPts){drawn=Math.min(totalPts,drawn+8);geo.setDrawRange(0,drawn);}
      lines.rotation.y=t*.1+.3;
      renderer.render(scene,camera);
    };tick();
    return()=>{cancelAnimationFrame(raf);geo.dispose();mat.dispose();renderer.dispose();ro.disconnect();io.disconnect();};
  },[]);
  return(
    <section ref={secRef} style={{padding:"130px 28px",background:isDark?"#0a0a0b":"#f5f5f7",position:"relative",overflow:"hidden",transition:"background .5s"}}>
      <canvas ref={canvasRef} className="sec-canvas"/>
      <div style={{maxWidth:980,margin:"0 auto",position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"52px 80px",alignItems:"center"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:20}}>3D · Arquitectura</p>
          <div style={{overflow:"hidden",marginBottom:22}}>
            <h2 className="clip-rv" style={{fontSize:"clamp(30px,4.8vw,58px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}>
              <span className={isDark?"acc-dk":"acc-lt"}>Del plano al fotorrealismo.</span>
            </h2>
          </div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:32}}>
            Pipeline completo desde SketchUp. Modelado arquitectónico, baking en Blender, renders estáticos en UE5 y Twinmotion 2025. Visualización 3D interactiva para web.
          </p>
          <div className="rv2" style={{transitionDelay:".28s",display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className={isDark?"btn-dk":"btn-lt"}>Ver renders 3D</button>
            <button className={`btn-ghost-${isDark?"dk":"lt"}`}>Pipeline →</button>
          </div>
        </div>
        <div className="rs" style={{transitionDelay:".1s",borderRadius:18,overflow:"hidden",background:isDark?"#1c1c1e":"#fff",border:`1px solid ${C.divider}`,boxShadow:isDark?"none":"0 4px 24px rgba(0,0,0,.09)"}}>
          <Img src={IMGS[1]} fb={FBK[1]} alt="Estadio 3D" style={{height:280}}/>
          <div style={{padding:"20px 22px 24px"}}>
            <div style={{fontSize:10.5,color:C.teal,letterSpacing:".08em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Visualización arquitectónica</div>
            <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:6,letterSpacing:"-.025em"}}>Estadio · SketchUp → UE5</div>
            <div style={{fontSize:13.5,color:C.textSec,letterSpacing:"-.01em"}}>Render fotorrealista 4K · Lumen GI · Nanite</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── UX SECTION — WebGL curl-noise fluid simulation ───────────────────────────
function UXSection({isDark,C,prefRM}){
  const canvasRef=useRef(null);
  useEffect(()=>{
    const c=canvasRef.current;if(!c||prefRM.current)return;
    const ctx=c.getContext("2d");
    let pts=[];
    const N=380;

    const init=()=>{
      c.width=c.offsetWidth;c.height=c.offsetHeight;
      pts=Array.from({length:N},(_,i)=>({
        x:Math.random()*c.width,
        y:Math.random()*c.height,
        hx:0,hy:0, // posición home — se asigna tras crear
        vx:(Math.random()-.5)*.3,
        vy:(Math.random()-.5)*.3,
        r:Math.random()*2.5+2,
        hue:190+Math.random()*20,
        bright: i<18,
      }));
      // guardar posición inicial como "home"
      pts.forEach(p=>{p.hx=p.x;p.hy=p.y;});
    };
    const ro=new ResizeObserver(init);ro.observe(c);init();

    const mouse={x:-999,y:-999};
    const onM=e=>{const r=c.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;};
    const onL=()=>{mouse.x=-999;mouse.y=-999;};
    const sec=c.parentElement;
    sec.addEventListener("mousemove",onM,{passive:true});
    sec.addEventListener("mouseleave",onL);

    let t=0,raf;
    const draw=()=>{
      raf=requestAnimationFrame(draw);t+=.00012;      const{width:w,height:h}=c;
      ctx.clearRect(0,0,w,h);

      pts.forEach((p,i)=>{
        // ── CAMPO DE FLUJO orgánico ──
        const fi=i*0.43;
        const baseX=Math.sin(t*0.11+fi*0.2)*0.022+Math.cos(t*0.07+fi*0.15)*0.014;
        const baseY=Math.cos(t*0.09+fi*0.18)*0.018+Math.sin(t*0.06+fi*0.22)*0.012;
        const gust=0.6+Math.sin(t*0.18+fi*0.9)*0.3+Math.cos(t*0.13+fi*1.1)*0.2;
        p.vx+=baseX*gust;
        p.vy+=baseY*gust;

        // ── RATÓN: repulsión notable ──
        const mdx=p.x-mouse.x,mdy=p.y-mouse.y;
        const md=Math.sqrt(mdx*mdx+mdy*mdy)||1;
        if(md<140){
          const f=1.1*(1-md/140)*(1-md/140);
          p.vx+=mdx/md*f;
          p.vy+=mdy/md*f;
        }

        // ── RETORNO AL HOME: fuerza suave hacia posición original ──
        // Solo actúa cuando se han alejado — no interfiere con la deriva normal
        const hDist=Math.sqrt((p.x-p.hx)**2+(p.y-p.hy)**2);
        if(hDist>8){
          p.vx+=(p.hx-p.x)*0.0018;
          p.vy+=(p.hy-p.y)*0.0018;
        }

        p.vx*=.97; p.vy*=.97;
        const spd=Math.sqrt(p.vx*p.vx+p.vy*p.vy)||1;
        if(spd>0.9){p.vx=p.vx/spd*0.9;p.vy=p.vy/spd*0.9;}

        p.x+=p.vx; p.y+=p.vy;

        // el home deriva muy lentamente con el flujo — no lucha contra él
        if(md>140){
          p.hx+=(p.x-p.hx)*0.004;
          p.hy+=(p.y-p.hy)*0.004;
        }

        if(p.x<-20){p.x=w+20;p.hx=p.x;}
        if(p.x>w+20){p.x=-20;p.hx=p.x;}
        if(p.y<-20){p.y=h+20;p.hy=p.y;}
        if(p.y>h+20){p.y=-20;p.hy=p.y;}

        // dibujar bolita
        const a1=p.bright?0.68:0.35;
        const a2=p.bright?0.48:0.24;
        const a3=p.bright?0.24:0.12;
        const rDraw=p.bright?p.r*1.4:p.r;
        const lx=p.x-rDraw*.35,ly=p.y-rDraw*.35;
        const g=ctx.createRadialGradient(lx,ly,rDraw*.05,p.x,p.y,rDraw*1.1);
        g.addColorStop(0,  `hsla(${p.hue+15},85%,88%,${a1})`);
        g.addColorStop(.35,`hsla(${p.hue},80%,68%,${a2})`);
        g.addColorStop(.75,`hsla(${p.hue-10},75%,48%,${a3})`);
        g.addColorStop(1,  `hsla(${p.hue-15},70%,28%,0)`);
        ctx.beginPath();
        ctx.arc(p.x,p.y,rDraw,0,Math.PI*2);
        ctx.fillStyle=g;
        ctx.fill();
      });
    };
    draw();
    return()=>{cancelAnimationFrame(raf);ro.disconnect();sec.removeEventListener("mousemove",onM);sec.removeEventListener("mouseleave",onL);};
  },[]);

  // ── CAPA PROTAGONISTA: bandada que se abre/cierra, muy reactiva al ratón ──
  const fgRef=useRef(null);
  const sharedMouse=useRef({x:-999,y:-999});
  useEffect(()=>{
    const c=fgRef.current;if(!c||prefRM.current)return;
    const ctx=c.getContext("2d");
    const N=110;
    let pts=[];

    const init=()=>{
      c.width=c.offsetWidth;c.height=c.offsetHeight;
      const cx=c.width*0.5,cy=c.height*0.5;
      pts=Array.from({length:N},(_,i)=>({
        x:cx+(Math.random()-.5)*c.width*0.75,
        y:cy+(Math.random()-.5)*c.height*0.65,
        vx:(Math.random()-.5)*0.3,
        vy:(Math.random()-.5)*0.3,
        r:Math.random()*1.8+1.8,
        hue:188+Math.random()*18,
      }));
    };
    const ro=new ResizeObserver(init);ro.observe(c);init();

    const sec=c.parentElement;
    const onM=e=>{const r=c.getBoundingClientRect();sharedMouse.current.x=e.clientX-r.left;sharedMouse.current.y=e.clientY-r.top;};
    const onL=()=>{sharedMouse.current.x=-999;sharedMouse.current.y=-999;};
    sec.addEventListener("mousemove",onM,{passive:true});
    sec.addEventListener("mouseleave",onL);

    let t=0,raf2;
    const draw=()=>{
      raf2=requestAnimationFrame(draw);t+=.0006;
      const{width:w,height:h}=c;
      ctx.clearRect(0,0,w,h);
      const mouse=sharedMouse.current;

      // centro de masa del grupo
      let gcx=0,gcy=0;
      pts.forEach(p=>{gcx+=p.x;gcy+=p.y;});
      gcx/=N; gcy/=N;

      // pulso: el grupo se expande y contrae rítmicamente
      const pulse=Math.sin(t*1.4)*0.00045+0.0008;

      pts.forEach((p,i)=>{
        const fi=i*0.55;

        // deriva orgánica suave
        p.vx+=Math.sin(t*0.9+fi*0.3)*0.018+Math.cos(t*0.7+fi*0.5)*0.012;
        p.vy+=Math.cos(t*0.8+fi*0.4)*0.018+Math.sin(t*0.6+fi*0.6)*0.012;

        // cohesión al centro del grupo (abre/cierra)
        p.vx+=(gcx-p.x)*pulse;
        p.vy+=(gcy-p.y)*pulse;

        // separación mínima
        pts.forEach(q=>{
          if(q===p)return;
          const dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy)||1;
          if(d<22){p.vx+=dx/d*0.12;p.vy+=dy/d*0.12;}
        });

        // RATÓN: obstáculo potente
        const mdx=p.x-mouse.x,mdy=p.y-mouse.y;
        const md=Math.sqrt(mdx*mdx+mdy*mdy)||1;
        if(md<180){
          const f=2.8*(1-md/180)*(1-md/180);
          p.vx+=mdx/md*f;
          p.vy+=mdy/md*f;
        }

        p.vx*=.93;p.vy*=.93;
        const spd=Math.sqrt(p.vx*p.vx+p.vy*p.vy)||1;
        if(spd>2.2){p.vx=p.vx/spd*2.2;p.vy=p.vy/spd*2.2;}

        p.x+=p.vx;p.y+=p.vy;
        if(p.x<-40)p.x=w+40;if(p.x>w+40)p.x=-40;
        if(p.y<-40)p.y=h+40;if(p.y>h+40)p.y=-40;

        // dibujar — tamaño según distancia al centro del grupo
        const dx=p.x-gcx, dy=p.y-gcy;
        const distG=Math.sqrt(dx*dx+dy*dy);
        const norm=Math.min(distG/140,1); // 0=centro, 1=periferia (radio ref 140px)
        const rD=(p.r*3.2)*(1-norm*0.78)+p.r*0.6; // centro ~×3.2, periferia ~×0.6
        const lx=p.x-rD*.38,ly=p.y-rD*.38;
        const g=ctx.createRadialGradient(lx,ly,rD*.04,p.x,p.y,rD*1.2);
        g.addColorStop(0,  `hsla(${p.hue+18},92%,94%,0.92)`);
        g.addColorStop(.28,`hsla(${p.hue},88%,74%,0.76)`);
        g.addColorStop(.65,`hsla(${p.hue-8},82%,54%,0.44)`);
        g.addColorStop(1,  `hsla(${p.hue-14},76%,32%,0)`);
        ctx.beginPath();ctx.arc(p.x,p.y,rD,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
      });
    };
    draw();
    return()=>{cancelAnimationFrame(raf2);ro.disconnect();sec.removeEventListener("mousemove",onM);sec.removeEventListener("mouseleave",onL);};
  },[]);

  return(
    <section style={{padding:"130px 28px",background:isDark?"#000":"#fff",position:"relative",overflow:"hidden",transition:"background .5s"}}>
      <canvas ref={canvasRef} className="sec-canvas"/>
      <canvas ref={fgRef} className="sec-canvas" style={{zIndex:1}}/>
      <div style={{maxWidth:980,margin:"0 auto",position:"relative",zIndex:2,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"52px 80px",alignItems:"center"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:20}}>UX · UI · Product Design</p>
          <div style={{overflow:"hidden",marginBottom:22}}>
            <h2 className="clip-rv" style={{fontSize:"clamp(30px,4.8vw,58px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}>
              <span className={isDark?"acc-dk":"acc-lt"}>Interfaces que enamoran.</span>
            </h2>
          </div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:32}}>
            Once años diseñando para millones de personas. Metodologías de investigación aplicadas a productos de alto impacto. LALIGA, deporte global, plataformas de referencia.
          </p>
          <div className="rv2" style={{transitionDelay:".28s",display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className={isDark?"btn-dk":"btn-lt"}>Ver proyectos UX · UI</button>
            <button className={`btn-ghost-${isDark?"dk":"lt"}`}>Metodología →</button>
          </div>
        </div>
        <div className="rs" style={{transitionDelay:".1s",borderRadius:18,overflow:"hidden",background:isDark?"#1c1c1e":"#fff",border:`1px solid ${C.divider}`,boxShadow:isDark?"none":"0 4px 24px rgba(0,0,0,.09)"}}>
          <Img src={IMGS[0]} fb={FBK[0]} alt="UX UI LALIGA" style={{height:280}}/>
          <div style={{padding:"20px 22px 24px"}}>
            <div style={{fontSize:10.5,color:C.teal,letterSpacing:".08em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Product Design · LALIGA</div>
            <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:6,letterSpacing:"-.025em"}}>App LALIGA · 20M+ usuarios</div>
            <div style={{fontSize:13.5,color:C.textSec,letterSpacing:"-.01em"}}>UX Research · Design System · Prototyping</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FULL STACK SECTION — constellation points ─────────────────────────────────
// (Effect also saved for individual Full Stack page)
function FullStackSection({isDark,C,prefRM}){
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||prefRM.current)return;
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.z=8;
    const N=80,positions=new Float32Array(N*3),colors=new Float32Array(N*3);
    for(let i=0;i<N;i++){positions[i*3]=(Math.random()-.5)*12;positions[i*3+1]=(Math.random()-.5)*8;positions[i*3+2]=(Math.random()-.5)*4;const t=Math.random();colors[i*3]=.37+t*.1;colors[i*3+1]=.77+t*.05;colors[i*3+2]=.78+t*.05;}
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(positions,3));geo.setAttribute("color",new THREE.BufferAttribute(colors,3));
    const pMat=new THREE.PointsMaterial({vertexColors:true,size:.12,transparent:true,opacity:.7,sizeAttenuation:true});
    const pts=new THREE.Points(geo,pMat);scene.add(pts);
    const linePts=[];
    for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=positions[i*3]-positions[j*3],dy=positions[i*3+1]-positions[j*3+1];if(Math.sqrt(dx*dx+dy*dy)<3.5)linePts.push(positions[i*3],positions[i*3+1],positions[i*3+2],positions[j*3],positions[j*3+1],positions[j*3+2]);}
    const lGeo=new THREE.BufferGeometry();lGeo.setAttribute("position",new THREE.Float32BufferAttribute(linePts,3));
    const lMat=new THREE.LineBasicMaterial({color:0x5ec4c8,transparent:true,opacity:.12});
    scene.add(new THREE.LineSegments(lGeo,lMat));
    const resize=()=>{const w=canvas.offsetWidth,h=canvas.offsetHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
    let t=0,raf;
    const tick=()=>{raf=requestAnimationFrame(tick);t+=.006;pts.rotation.y=t*.08;pts.rotation.x=Math.sin(t*.3)*.06;renderer.render(scene,camera);};tick();
    return()=>{cancelAnimationFrame(raf);geo.dispose();pMat.dispose();lGeo.dispose();lMat.dispose();renderer.dispose();ro.disconnect();};
  },[]);
  const stack=[["Angular 17+","React 18","TypeScript"],["Node.js","Express","MongoDB"],["MySQL","REST APIs","Three.js"],["UE5","Blender","SketchUp"]];
  return(
    <section style={{padding:"130px 28px",background:isDark?"#0a0a0b":"#f5f5f7",position:"relative",overflow:"hidden",transition:"background .5s"}}>
      <canvas ref={canvasRef} className="sec-canvas"/>
      <div style={{maxWidth:980,margin:"0 auto",position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"52px 80px",alignItems:"start"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:20}}>Full Stack · Dev</p>
          <div style={{overflow:"hidden",marginBottom:22}}>
            <h2 className="clip-rv" style={{fontSize:"clamp(30px,4.8vw,58px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}>
              <span style={{color:C.text}}>Del diseño al </span><span className={isDark?"acc-dk":"acc-lt"}>código real.</span>
            </h2>
          </div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:32}}>
            Angular 17+ con Signals, Node.js, MongoDB y MySQL. Arquitecturas escalables que van de la idea al deploy, integrando 3D y visualización interactiva.
          </p>
          <div className="rv2" style={{transitionDelay:".28s",display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className={isDark?"btn-dk":"btn-lt"}>Ver proyectos dev</button>
            <button className={`btn-ghost-${isDark?"dk":"lt"}`}>Stack completo →</button>
          </div>
        </div>
        <div className="rv2" style={{transitionDelay:".12s",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {stack.map((col,i)=>col.map(t=>(
            <div key={t} className="rs" style={{transitionDelay:`${(i*.1)+.1}s`,padding:"13px 16px",borderRadius:13,background:isDark?"rgba(255,255,255,.055)":"rgba(0,0,0,.042)",border:`1px solid ${C.divider}`,fontSize:13.5,fontWeight:500,color:C.text,letterSpacing:"-.01em"}}>
              {t}
            </div>
          )))}
        </div>
      </div>
    </section>
  );
}

// ─── MINI PROJECTS — visual separator ─────────────────────────────────────────
const PROJECTS=[
  {id:0,cat:"UX · Product Design",title:"LALIGA App",sub:"Experiencia para 20M+ usuarios en 150 países.",tags:["Figma","UX Research"],year:"2023–24",src:IMGS[0],fb:FBK[0]},
  {id:1,cat:"3D · Arquitectura",title:"Estadio Render",sub:"SketchUp → UE5 → fotorrealismo 4K.",tags:["UE5","SketchUp"],year:"2024",src:IMGS[1],fb:FBK[1]},
  {id:2,cat:"Full Stack",title:"Plataforma Angular",sub:"Angular + Node.js + MongoDB.",tags:["Angular","Node.js"],year:"2025",src:IMGS[2],fb:FBK[2]},
  {id:3,cat:"Branding · Visual",title:"Sistema Identidad",sub:"Brand system para deporte global.",tags:["Brand","Figma"],year:"2022–24",src:IMGS[3],fb:FBK[3]},
];
function MiniProjects({isDark,C,projects,alt}){
  return(
    <section style={{padding:"72px 28px",background:alt?(isDark?"#000":"#fff"):(isDark?"#111114":"#f5f5f7"),transition:"background .5s",borderTop:`1px solid ${C.divider}`,borderBottom:`1px solid ${C.divider}`}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
          <p style={{fontSize:12,color:C.textSec,letterSpacing:".08em",textTransform:"uppercase",fontWeight:500}}>
            {alt?"Proyectos destacados":"Más trabajo"}
          </p>
          <button className={isDark?"btn-dk":"btn-lt"} style={{fontSize:12.5,padding:"7px 18px"}}>
            Ver todos →
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
          {projects.map((p,i)=>(
            <div key={`${p.id}-${i}`} className={`rs ${isDark?"card-dk":"card-lt"}`} style={{transitionDelay:`${i*.1}s`}}>
              <div style={{height:160,overflow:"hidden",position:"relative"}}>
                <Img src={p.src} fb={p.fb} alt={p.title}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 50%,rgba(0,0,0,.42) 100%)"}}/>
                <div style={{position:"absolute",top:10,right:10,padding:"2px 8px",borderRadius:980,background:"rgba(0,0,0,.52)",backdropFilter:"blur(6px)",fontSize:10.5,color:"rgba(255,255,255,.7)",fontWeight:500}}>{p.year}</div>
              </div>
              <div style={{padding:"16px 18px 20px"}}>
                <div style={{fontSize:10,color:C.teal,letterSpacing:".08em",textTransform:"uppercase",fontWeight:700,marginBottom:5}}>{p.cat}</div>
                <div style={{fontSize:15.5,fontWeight:700,letterSpacing:"-.025em",color:C.text,marginBottom:5}}>{p.title}</div>
                <p style={{fontSize:12.5,color:C.textSec,lineHeight:1.55,marginBottom:14}}>{p.sub}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:4}}>{p.tags.map(t=><span key={t} style={{padding:"2px 8px",borderRadius:980,background:isDark?"rgba(255,255,255,.08)":"#ebebef",fontSize:10.5,color:C.textSec,fontWeight:500}}>{t}</span>)}</div>
                  <div style={{width:30,height:30,borderRadius:"50%",background:isDark?"rgba(255,255,255,.1)":"#e8e8ed",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <ChR s={11} c={isDark?"#fff":"#1d1d1f"}/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COMPARISON ───────────────────────────────────────────────────────────────
function ComparisonSection({isDark,C}){
  const [pos,setPos]=useState(50);
  const dragging=useRef(false);
  const wRef=useRef(null);
  const getX=useCallback(e=>{const r=wRef.current?.getBoundingClientRect();if(!r)return 50;const cx=e.touches?e.touches[0].clientX:e.clientX;return Math.max(2,Math.min(98,((cx-r.left)/r.width)*100));});
  const onDown=e=>{dragging.current=true;e.preventDefault();};
  const onMove=useCallback(e=>{if(dragging.current)setPos(getX(e));});
  const onUp=()=>{dragging.current=false;};
  useEffect(()=>{window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);window.addEventListener("touchmove",onMove,{passive:false});window.addEventListener("touchend",onUp);return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onUp);};});
  return(
    <section style={{padding:"130px 28px",background:isDark?"#000":"#fff",transition:"background .5s"}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:18}}>Pipeline 3D</p>
          <div style={{overflow:"hidden",marginBottom:16}}><h2 className="clip-rv" style={{fontSize:"clamp(28px,4.8vw,56px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}><span style={{color:C.text}}>Del modelo al </span><span className={isDark?"acc-dk":"acc-lt"}>fotorrealismo.</span></h2></div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:16,color:C.textSec,maxWidth:460,margin:"0 auto",lineHeight:1.6}}>Arrastra para comparar el modelo 3D con el render final en UE5.</p>
        </div>
        <div ref={wRef} className="rs" style={{position:"relative",height:"clamp(260px,44vw,480px)",borderRadius:20,overflow:"hidden",cursor:"ew-resize",userSelect:"none",border:`1px solid ${C.divider}`,boxShadow:isDark?"0 24px 64px rgba(0,0,0,.5)":"0 24px 64px rgba(0,0,0,.09)"}} onMouseDown={onDown} onTouchStart={onDown}>
          <div style={{position:"absolute",inset:0}}><Img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1000&q=80" fb="linear-gradient(135deg,#0a1a0a,#1a3520)" alt="UE5 render"/>
            <div style={{position:"absolute",top:14,right:14,padding:"4px 12px",borderRadius:980,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",fontSize:11,color:"#5ec4c8",fontWeight:600}}>UE5 →</div></div>
          <div style={{position:"absolute",inset:0,clipPath:`inset(0 ${100-pos}% 0 0)`}}>
            <Img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80" fb="linear-gradient(135deg,#0a0a14,#14143a)" alt="SketchUp"/>
            <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(94,196,200,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(94,196,200,.07) 1px,transparent 1px)`,backgroundSize:"38px 38px",mixBlendMode:"screen"}}/>
            <div style={{position:"absolute",top:14,left:14,padding:"4px 12px",borderRadius:980,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",fontSize:11,color:"rgba(255,255,255,.6)",fontWeight:600}}>← SketchUp</div>
          </div>
          <div style={{position:"absolute",top:0,bottom:0,left:`${pos}%`,width:2,background:"rgba(255,255,255,.92)",transform:"translateX(-50%)",zIndex:10,boxShadow:"0 0 14px rgba(255,255,255,.2)"}} onMouseDown={onDown} onTouchStart={onDown}>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,.95)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 18px rgba(0,0,0,.35)",gap:3}}>
              <ChL s={11} c="#1d1d1f"/><ChR s={11} c="#1d1d1f"/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── DEVICE HIPERREALISTA ─────────────────────────────────────────────────────
function DeviceSection({isDark,C,wrapRef,prefRM}){
  const secRef=useRef(null);
  const devRef=useRef(null);
  useEffect(()=>{
    const wrap=wrapRef.current;if(!wrap)return;
    const fn=()=>{
      if(!secRef.current||!devRef.current||prefRM.current)return;
      const rect=secRef.current.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,(wrap.clientHeight-rect.top)/(wrap.clientHeight+rect.height)));
      devRef.current.style.transform=`perspective(1400px) rotateY(${(p-.5)*36}deg) rotateX(${(.5-p)*14}deg) scale(${.88+p*.12})`;
    };
    wrap.addEventListener("scroll",fn,{passive:true});fn();
    return()=>wrap.removeEventListener("scroll",fn);
  },[]);
  const fl=isDark;
  return(
    <section ref={secRef} style={{padding:"130px 28px",background:isDark?"#0a0a0b":"#f5f5f7",transition:"background .5s",overflow:"hidden"}}>
      <div style={{maxWidth:980,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:"52px 80px",alignItems:"center"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:18}}>UX · Product Design</p>
          <div style={{overflow:"hidden",marginBottom:20}}><h2 className="clip-rv" style={{fontSize:"clamp(26px,4vw,50px)",fontWeight:700,letterSpacing:"-.036em",lineHeight:1.1}}><span style={{color:C.text}}>Diseño que vive<br/>en </span><span className={isDark?"acc-dk":"acc-lt"}>los dedos.</span></h2></div>
          <p className="rv2" style={{transitionDelay:".14s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:34}}>Interfaces intuitivas desde el primer toque. Once años diseñando para millones de personas en el deporte global.</p>
          <div className="rv2" style={{transitionDelay:".28s"}}><button className={isDark?"btn-dk":"btn-lt"}>Ver proyectos UX →</button></div>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:540}}>
          <div ref={devRef} style={{transition:"transform .14s ease-out",transformStyle:"preserve-3d",position:"relative"}}>
            <div style={{width:252,height:530,borderRadius:50,position:"relative",
              background:fl?"linear-gradient(160deg,#3c3c40,#242426,#1c1c1e,#262628,#3c3c40)":"linear-gradient(160deg,#d0d0d8,#c0c0c8,#b0b0b8,#bcbcc4,#d0d0d8)",
              padding:"10px",
              boxShadow:fl?`0 100px 200px rgba(0,0,0,.8),0 50px 100px rgba(0,0,0,.55),inset 0 2px 0 rgba(255,255,255,.22),inset 0 -2px 0 rgba(0,0,0,.45),inset 3px 0 0 rgba(255,255,255,.1),inset -3px 0 0 rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.07)`:`0 100px 200px rgba(0,0,0,.22),0 50px 100px rgba(0,0,0,.14),inset 0 2px 0 rgba(255,255,255,.92),inset 0 -2px 0 rgba(0,0,0,.14),inset 3px 0 0 rgba(255,255,255,.65),inset -3px 0 0 rgba(0,0,0,.09),0 0 0 1px rgba(0,0,0,.1)`,
              transformStyle:"preserve-3d",
            }}>
              <div style={{position:"absolute",right:-11,top:40,bottom:40,width:12,borderRadius:"0 10px 10px 0",background:fl?"linear-gradient(90deg,#141416,#1c1c1e,#111113)":"linear-gradient(90deg,#b4b4bc,#a8a8b0,#a0a0a8)",boxShadow:fl?"3px 0 10px rgba(0,0,0,.7)":"3px 0 10px rgba(0,0,0,.14)"}}>
                <div style={{position:"absolute",right:1,top:"32%",width:3.5,height:44,background:fl?"#2e2e32":"#b8b8c0",borderRadius:"0 3px 3px 0"}}/>
              </div>
              <div style={{position:"absolute",left:-11,top:40,bottom:40,width:12,borderRadius:"10px 0 0 10px",background:fl?"linear-gradient(270deg,#141416,#1c1c1e,#111113)":"linear-gradient(270deg,#b4b4bc,#a8a8b0,#a0a0a8)",boxShadow:fl?"-3px 0 10px rgba(0,0,0,.7)":"-3px 0 10px rgba(0,0,0,.14)"}}>
                {[0,1].map(i=><div key={i} style={{position:"absolute",left:1,top:`${28+i*18}%`,width:3.5,height:32,background:fl?"#2e2e32":"#b8b8c0",borderRadius:"3px 0 0 3px"}}/>)}
              </div>
              <div style={{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",width:88,height:30,borderRadius:15,background:"#000",zIndex:20,boxShadow:"0 0 0 1.5px rgba(255,255,255,.04),inset 0 1px 4px rgba(0,0,0,.9)"}}>
                <div style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",width:11,height:11,borderRadius:"50%",background:"#070707",border:"1.5px solid #181818"}}/>
              </div>
              <div style={{width:"100%",height:"100%",borderRadius:42,overflow:"hidden",position:"relative",background:"linear-gradient(168deg,#06060f,#090f22 40%,#0e0816 75%,#06060f)"}}>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(138deg,rgba(255,255,255,.08) 0%,transparent 40%)",borderRadius:42,zIndex:15,pointerEvents:"none"}}/>
                <div style={{padding:"68px 14px 16px",height:"100%",display:"flex",flexDirection:"column",position:"relative",zIndex:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,fontSize:11,color:"rgba(255,255,255,.4)",fontWeight:600}}><span>9:41</span><span style={{fontSize:9}}>●●●● WiFi</span></div>
                  <div style={{fontSize:21,fontWeight:700,color:"#fff",marginBottom:2,letterSpacing:"-.03em"}}>LALIGA</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.28)",marginBottom:18}}>Temporada 2025–26</div>
                  <div style={{borderRadius:14,padding:"13px 14px",marginBottom:10,background:"rgba(94,196,200,.09)",border:"1px solid rgba(94,196,200,.18)"}}>
                    <div style={{fontSize:9.5,color:"#5ec4c8",fontWeight:700,letterSpacing:".07em",marginBottom:7,textTransform:"uppercase"}}>⬤ En directo</div>
                    <div style={{fontSize:13.5,fontWeight:700,color:"#fff"}}>Real Madrid 2 – 1 Barça</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.32)",marginTop:3}}>Min 73' · Santiago Bernabéu</div>
                  </div>
                  {[{t:"Atlético 1-0 Sevilla",s:"Final",e:"🔴"},{t:"Clasificación · J30",s:"Ver tabla",e:"📊"},{t:"Mbappé — 15 goles",s:"Top goleador",e:"⭐"}].map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,marginBottom:7,background:"rgba(255,255,255,.046)",border:"1px solid rgba(255,255,255,.04)"}}>
                      <span style={{fontSize:13,flexShrink:0}}>{item.e}</span>
                      <div style={{flex:1}}><div style={{fontSize:11.5,fontWeight:600,color:"#fff"}}>{item.t}</div><div style={{fontSize:9.5,color:"rgba(255,255,255,.28)",marginTop:1}}>{item.s}</div></div>
                      <ChR s={10} c="rgba(255,255,255,.2)"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{position:"absolute",bottom:-32,left:"50%",transform:"translateX(-50%)",width:180,height:22,borderRadius:"50%",background:"rgba(0,0,0,.3)",filter:"blur(20px)",zIndex:-1}}/>
          </div>
        </div>
      </div>
    </section>
  );
}
