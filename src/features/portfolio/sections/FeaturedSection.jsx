import { useRef, useState } from "react";
import { ChL, ChR } from "../icons";
import { IMGS, FBK } from "../content";
import { SmartImage as Img } from "../SmartImage";

export function FeaturedSection({isDark,C}){
  const [active,setActive]=useState(0);
  const imgRef=useRef(null);
  const items=[
    {label:"UX · LALIGA",cat:"Product Design",headline:"Diseño de",accent:"producto.",sub:"Experiencias digitales para 20 millones de seguidores en todo el mundo.",src:IMGS[0],fb:FBK[0]},
    {label:"3D · Estadios",cat:"3D Visualization",headline:"Arquitectura",accent:"fotorrealista.",sub:"Modelos SketchUp, visualización en UE5 y rendering web interactivo.",src:IMGS[1],fb:FBK[1]},
    {label:"Full Stack",cat:"Development",headline:"Del diseño al",accent:"código.",sub:"Angular, Node.js y MongoDB. Interfaces que funcionan en producción real.",src:IMGS[2],fb:FBK[2]},
    {label:"Branding",cat:"Brand Design",headline:"Identidad visual de",accent:"marca.",sub:"Sistemas de diseño coherentes para entidades del deporte global.",src:IMGS[3],fb:FBK[3]},
  ];
  const go=i=>{if(i===active)return;const el=imgRef.current;if(el){el.style.opacity="0";el.style.transform="scale(1.025)";}setTimeout(()=>{setActive(i);if(el){el.style.transition="opacity .55s ease,transform .65s ease";el.style.opacity="1";el.style.transform="scale(1)";}},160);};
  const onPrev=()=>go((active-1+items.length)%items.length);
  const onNext=()=>go((active+1)%items.length);
  const cur=items[active];
  return(
    <section style={{background:isDark?"#0a0a0b":"#f5f5f7",transition:"background .5s"}}>
      <div style={{maxWidth:980,margin:"0 auto",padding:"var(--featured-head-pad-top,96px) var(--page-pad-x,28px) var(--featured-head-pad-bottom,56px)"}}>
        <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:18}}>Proyectos seleccionados</p>
        <h2 className={`rv ttl-rv ${isDark?"acc-dk":"acc-lt"}`} style={{transitionDelay:".12s",fontSize:"clamp(34px,5.2vw,64px)",fontWeight:700,letterSpacing:"-.042em",lineHeight:1.03}}>
          <span className={isDark?"acc-dk":"acc-lt"}>El trabajo habla por sí solo.</span>
        </h2>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 var(--page-pad-x,28px)"}}>
        <div style={{borderRadius:"20px 20px 0 0",overflow:"hidden",position:"relative",height:"clamp(320px,52vw,600px)"}}>
          <div ref={imgRef} style={{width:"100%",height:"100%",transition:"none"}}><Img src={cur.src} fb={cur.fb} alt={cur.label} sizes="(max-width: 768px) 100vw, 1200px"/></div>
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
            <button onClick={onPrev} style={{width:42,height:42,borderRadius:"50%",border:"none",cursor:"pointer",background:"rgba(255,255,255,.14)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.26)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.14)"}>
              <ChL/>
            </button>
            <button onClick={onNext} style={{width:42,height:42,borderRadius:"50%",border:"none",cursor:"pointer",background:"rgba(255,255,255,.14)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.26)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.14)"}>
              <ChR/>
            </button>
          </div>
        </div>
        <div style={{background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.025)",borderRadius:"0 0 20px 20px",borderStyle:"solid",borderColor:isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)",borderWidth:"0 1px 1px 1px",padding:"0 var(--page-pad-x,28px)"}}>
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

