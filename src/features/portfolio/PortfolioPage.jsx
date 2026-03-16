/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { PORTFOLIO_CSS } from "./styles";
import { IcoLI, IcoGH } from "./icons";
import { PROJECTS } from "./content";
import { computePortfolioLayout } from "./layout";
import { HeroGallerySection } from "./sections/HeroGallerySection";
import { CloseLookSection } from "./sections/CloseLookSection";
import { MiniProjects } from "./sections/MiniProjectsSection";
import { FeaturedSection } from "./sections/FeaturedSection";
import { ArchSection } from "./sections/ArchSection";
import { UXSection } from "./sections/UXSection";
import { FullStackSection } from "./sections/FullStackSection";
import { DeviceSection } from "./sections/DeviceSection";
import { ComparisonSection } from "./sections/ComparisonSection";

// -------------------------------------------------------------------------------
// SAVED FOR INDIVIDUAL SECTION PAGES (not rendered on home):
// - SectionUXUI effect: fluid particles (organic human-feel network)
// - SectionFullStack effect: constellation with vertex connections
// These effects ARE rendered here inside SectionBlock components on home,
// but the full individual pages will be built separately.
// -------------------------------------------------------------------------------

// Sphere Shader
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

// Main
export default function PortfolioPage(){
  const [theme,setTheme]=useState("dark");
  const [scrolled,setScrolled]=useState(false);
  const [activeNav,setActiveNav]=useState("Trabajo");
  const [vp,setVp]=useState({w:1920,h:1080});
  const wrapRef=useRef(null);
  const canvasRef=useRef(null);
  const scrollDirRef=useRef("down");
  const lastScrollTopRef=useRef(0);
  const isDark=theme==="dark";
  const prefRM=useRef(false);

  useEffect(()=>{
    if(typeof window!=="undefined"){
      prefRM.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    const s=document.createElement("style");
    s.textContent=PORTFOLIO_CSS;
    document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  useEffect(()=>{
    const el=wrapRef.current;if(!el)return;
    const fn=()=>{
      const top=el.scrollTop;
      if(top!==lastScrollTopRef.current){
        scrollDirRef.current=top>lastScrollTopRef.current?"down":"up";
        lastScrollTopRef.current=top;
      }
      setScrolled(top>50);
    };
    el.addEventListener("scroll",fn,{passive:true});return()=>el.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    const onResize=()=>setVp({w:window.innerWidth,h:window.innerHeight});
    onResize();
    window.addEventListener("resize",onResize,{passive:true});
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  const { rootVars, closeLookAlignLeft } = computePortfolioLayout(vp);

  useEffect(()=>{
    const el=wrapRef.current;if(!el)return;
    const io=new IntersectionObserver(
      e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add("in");}),
      {threshold:.04,rootMargin:"0px 0px -40px 0px",root:el}
    );
    setTimeout(()=>el.querySelectorAll(".rv,.rv2,.rs,.rl,.rr,.clip-rv").forEach(x=>io.observe(x)),150);
    return()=>io.disconnect();
  },[]);

  useEffect(()=>{
    const el=wrapRef.current;if(!el)return;
    const nodes=el.querySelectorAll(".ttl-rv");
    nodes.forEach(n=>n.setAttribute("data-reveal-dir","down"));
    const io=new IntersectionObserver(
      entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add("in");
          }else{
            entry.target.classList.remove("in");
            entry.target.setAttribute("data-reveal-dir",scrollDirRef.current);
          }
        });
      },
      {threshold:.2,rootMargin:"-6% 0px -6% 0px",root:el}
    );
    nodes.forEach(n=>io.observe(n));
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

  const NAVLINKS=["Trabajo","3D","Sobre m\u00ed","Contacto"];

  return(
    <div ref={wrapRef} className="p" style={{height:"100vh",overflowY:"scroll",overflowX:"hidden",background:C.bg,color:C.text,transition:"background .5s,color .35s",scrollbarWidth:"thin",...rootVars}}>

      {/* Navbar */}
      <nav style={{
        position:"sticky",top:0,zIndex:200,height:52,
        display:"flex",alignItems:"stretch",justifyContent:"space-between",
        padding:"0 var(--nav-pad-x,24px)",animation:"pfade .4s ease",
        background:isDark?"#1d1d1f":C.nav,
        backdropFilter:!isDark?"blur(20px) saturate(180%)":"none",
        WebkitBackdropFilter:!isDark?"blur(20px) saturate(180%)":"none",
        borderBottom:`1px solid ${C.navBorder}`,
        transition:"background .25s,border-color .25s",
      }}>
        <div style={{display:"flex",alignItems:"center"}}>
          <span style={{fontSize:15,fontWeight:600,letterSpacing:"-.04em",color:isDark?"#f5f5f7":"#1d1d1f"}}>Manuel Garc\u00eda Llera</span>
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
            {isDark?"\u2600\ufe0f Claro":"\ud83c\udf19 Oscuro"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{height:"var(--hero-full-h,100dvh)",minHeight:"var(--hero-min-h,620px)",position:"relative",marginTop:-52,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#000"}}>
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 65% 55% at 50% 40%,rgba(94,196,200,.034) 0%,transparent 65%)",pointerEvents:"none"}}/>

        <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"0 var(--hero-side-pad,24px)",maxWidth:980,width:"100%"}}>
          <p style={{fontSize:13.5,color:"rgba(255,255,255,.62)",letterSpacing:".015em",marginBottom:20,fontWeight:400}}>
            Portfolio \u00b7 Manuel Garc\u00eda Llera
          </p>
          <h1 style={{fontSize:"clamp(50px,8.5vw,98px)",fontWeight:700,lineHeight:1.03,letterSpacing:"-.048em",marginBottom:6}}>
            <span style={{display:"block",color:"#fff"}}>Dise\u00f1o que</span>
            <span style={{display:"block",color:"#fff"}}>piensa en <span className="acc-dk">c\u00f3digo.</span></span>
          </h1>
          <p style={{fontSize:"clamp(17px,1.9vw,20px)",color:"rgba(255,255,255,.7)",lineHeight:1.58,maxWidth:500,margin:"28px auto 44px",fontWeight:400,letterSpacing:"-.015em"}}>
            Visual Design Manager en LALIGA.<br/>UX, producto, 3D arquitect\u00f3nico y full stack.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn-blue">Ver proyectos</button>
            <button className="btn-ghost-dk">M\u00e1s sobre m\u00ed</button>
          </div>
        </div>

        <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
          <div style={{width:20,height:32,borderRadius:10,border:"1.5px solid rgba(255,255,255,.18)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:4}}>
            <div style={{width:3,height:7,borderRadius:2,background:"rgba(255,255,255,.3)",animation:"pscroll 2.2s infinite ease-in-out"}}/>
          </div>
        </div>
      </section>

      {/* Featured */}
      <HeroGallerySection isDark={isDark} prefRM={prefRM}/> 
      <CloseLookSection isDark={isDark} prefRM={prefRM} alignLeft={closeLookAlignLeft}/>

      <FeaturedSection isDark={isDark} C={C}/>

      {/* Section: 3D Arquitectura */}
      <ArchSection isDark={isDark} C={C} prefRM={prefRM}/>

      {/* Mini projects: visual separator */}
      <MiniProjects isDark={isDark} C={C} projects={[PROJECTS[0],PROJECTS[1],PROJECTS[2]]}/>

      {/* Section: UX / Product design */}
      <UXSection isDark={isDark} C={C} prefRM={prefRM}/>

      {/* Mini projects: separator */}
      <MiniProjects isDark={isDark} C={C} projects={[PROJECTS[3],PROJECTS[0],PROJECTS[1]]} alt/>

      {/* Section: Full stack */}
      <FullStackSection isDark={isDark} C={C} prefRM={prefRM}/>

      {/* Device */}
      <DeviceSection isDark={isDark} C={C} wrapRef={wrapRef} prefRM={prefRM}/>

      {/* Comparison */}
      <ComparisonSection isDark={isDark} C={C}/>

      {/* CTA */}
      <section style={{padding:"var(--sec-pad-y-lg,150px) var(--page-pad-x,28px)",textAlign:"center",background:C.ctaBg,transition:"background .5s"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <p className="rv" style={{fontSize:12,color:C.ctaTextSec,letterSpacing:".1em",textTransform:"uppercase",fontWeight:500,marginBottom:22}}>Contacto</p>
          <h2 className="rv ttl-rv" style={{transitionDelay:".14s",fontSize:"clamp(34px,6vw,68px)",fontWeight:700,letterSpacing:"-.046em",lineHeight:1.02,marginBottom:20,color:C.ctaText}}>
            Construyamos algo{" "}
            {/* Gradient adapts to background: dark bg (light mode) -> white/teal; light bg (dark mode) -> dark/teal */}
            <span className={isDark?"acc-lt":"acc-dk"}>extraordinario.</span>
          </h2>
          <p className="rv" style={{transitionDelay:".26s",fontSize:17,lineHeight:1.65,marginBottom:44,fontWeight:400,color:C.ctaTextSec}}>
            Disponible para proyectos de dise\u00f1o, producto y 3D arquitect\u00f3nico.
          </p>
          <div className="rv" style={{transitionDelay:".38s",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",alignItems:"center"}}>
            <button className="btn-blue" style={{padding:"13px 28px"}}>Contactar \u2192</button>
            {/* CTA background is inverted by theme: dark mode = light surface; light mode = dark surface */}
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

// End of main portfolio page

