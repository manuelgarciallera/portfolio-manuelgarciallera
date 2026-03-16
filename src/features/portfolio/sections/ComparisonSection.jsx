import { useCallback, useEffect, useRef, useState } from "react";
import { ChL, ChR } from "../icons";
import { SmartImage as Img } from "../SmartImage";

export function ComparisonSection({isDark,C}){
  const [pos,setPos]=useState(50);
  const dragging=useRef(false);
  const wRef=useRef(null);
  const getX=useCallback(e=>{const r=wRef.current?.getBoundingClientRect();if(!r)return 50;const cx=e.touches?e.touches[0].clientX:e.clientX;return Math.max(2,Math.min(98,((cx-r.left)/r.width)*100));},[]);
  const onDown=e=>{dragging.current=true;e.preventDefault();};
  const onMove=useCallback(e=>{if(dragging.current)setPos(getX(e));},[getX]);
  const onUp=()=>{dragging.current=false;};
  useEffect(()=>{window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);window.addEventListener("touchmove",onMove,{passive:false});window.addEventListener("touchend",onUp);return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onUp);};},[onMove]);
  return(
    <section style={{padding:"var(--sec-pad-y,130px) var(--page-pad-x,28px)",background:isDark?"#000":"#fff",transition:"background .5s"}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:18}}>Pipeline 3D</p>
          <div style={{overflow:"hidden",marginBottom:16}}><h2 className="clip-rv ttl-rv" style={{fontSize:"clamp(28px,4.8vw,56px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}><span style={{color:C.text}}>Del modelo al </span><span className={isDark?"acc-dk":"acc-lt"}>fotorrealismo.</span></h2></div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:16,color:C.textSec,maxWidth:460,margin:"0 auto",lineHeight:1.6}}>Arrastra para comparar el modelo 3D con el render final en UE5.</p>
        </div>
        <div ref={wRef} className="rs" style={{position:"relative",height:"clamp(260px,44vw,480px)",borderRadius:20,overflow:"hidden",cursor:"ew-resize",userSelect:"none",border:`1px solid ${C.divider}`,boxShadow:isDark?"0 24px 64px rgba(0,0,0,.5)":"0 24px 64px rgba(0,0,0,.09)"}} onMouseDown={onDown} onTouchStart={onDown}>
          <div style={{position:"absolute",inset:0}}><Img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1000&q=80" fb="linear-gradient(135deg,#0a1a0a,#1a3520)" alt="UE5 render" sizes="(max-width: 980px) 100vw, 980px"/>
            <div style={{position:"absolute",top:14,right:14,padding:"4px 12px",borderRadius:980,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",fontSize:11,color:"#5ec4c8",fontWeight:600}}>UE5 \u2192</div></div>
          <div style={{position:"absolute",inset:0,clipPath:`inset(0 ${100-pos}% 0 0)`}}>
            <Img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80" fb="linear-gradient(135deg,#0a0a14,#14143a)" alt="SketchUp" sizes="(max-width: 980px) 100vw, 980px"/>
            <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(94,196,200,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(94,196,200,.07) 1px,transparent 1px)`,backgroundSize:"38px 38px",mixBlendMode:"screen"}}/>
            <div style={{position:"absolute",top:14,left:14,padding:"4px 12px",borderRadius:980,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",fontSize:11,color:"rgba(255,255,255,.6)",fontWeight:600}}>\u2190 SketchUp</div>
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


