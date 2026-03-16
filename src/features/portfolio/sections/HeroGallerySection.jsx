import { useEffect, useRef, useState } from "react";

import { HERO_GALLERY, HERO_GALLERY_AUTOPLAY_MS } from "../content";
import { IcoPause, IcoPlay, IcoReplay } from "../icons";
import { SmartImage as Img } from "../SmartImage";

export function HeroGallerySection({ isDark, prefRM }){
  const [active,setActive]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [ended,setEnded]=useState(false);
  const [elapsedMs,setElapsedMs]=useState(0);
  const [playHover,setPlayHover]=useState(false);
  const frameRef=useRef(null);
  const advanceTimerRef=useRef(null);
  const startedAtRef=useRef(0);
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
    if(advanceTimerRef.current){
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current=null;
    }
    if(!playing||prefRM.current||ended)return;
    startedAtRef.current=performance.now();
    const remaining=Math.max(60,HERO_GALLERY_AUTOPLAY_MS-elapsedMs);
    advanceTimerRef.current=setTimeout(()=>{
      if(active<n-1){
        setActive(active+1);
        setElapsedMs(0);
      }else{
        setElapsedMs(HERO_GALLERY_AUTOPLAY_MS);
        setPlaying(false);
        setEnded(true);
      }
    },remaining);
    return()=>{
      if(advanceTimerRef.current){
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current=null;
      }
    };
  },[playing,prefRM,ended,active,n,elapsedMs]);

  useEffect(()=>()=>{if(advanceTimerRef.current)clearTimeout(advanceTimerRef.current);},[]);

  const onPickSlide=i=>{
    setActive(i);
    setPlaying(false);
    setEnded(false);
    setElapsedMs(0);
  };

  const onTogglePlay=()=>{
    if(prefRM.current)return;
    if(ended){
      setActive(0);
      setEnded(false);
      setElapsedMs(0);
      setPlaying(true);
      return;
    }
    if(playing){
      const now=performance.now();
      const delta=startedAtRef.current?now-startedAtRef.current:0;
      setElapsedMs(v=>Math.min(HERO_GALLERY_AUTOPLAY_MS,v+delta));
      setPlaying(false);
      return;
    }
    setPlaying(true);
  };

  const gap=w<760?10:22;
  const slideW=w<760?Math.max(304,w*.93):Math.min(1280,Math.max(1030,w*.68));
  const slideH=w<760?438:"var(--hero-gallery-slide-h,686px)";
  const tx=((w-slideW)/2)-(active*(slideW+gap));
  const controlH=w<760?58:"var(--hero-gallery-control-h,58px)";
  const dotSize=w<760?10:"var(--hero-gallery-dot-size,10px)";
  const activeDotW=w<760?74:"var(--hero-gallery-active-dot-w,74px)";
  const iconMain=w<760?27:(w<2560?22:25);
  const iconPause=w<760?25:(w<2560?20:23);
  const leadX=Math.max(0,(w-slideW)/2);

  return(
    <section style={{padding:"var(--hero-gallery-pad-top,132px) 0 var(--hero-gallery-pad-bottom,0px)",background:isDark?"#1c1c24":"#f0f0f3",transition:"background .5s",height:"var(--hero-gallery-section-h,84vh)",boxSizing:"border-box",overflow:"hidden"}}>
      <div style={{width:"100vw",position:"relative",left:"50%",transform:"translateX(-50%)"}}>
        <h2 className={`ttl-rv ${isDark?"acc-dk":"acc-lt"}`} style={{fontSize:"clamp(34px,4vw,52px)",fontWeight:700,letterSpacing:"-.03em",lineHeight:1.04,margin:`0 0 var(--hero-gallery-title-mb,42px) ${leadX}px`}}>Lo principal.</h2>
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
                    ].map((chip)=>( 
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

      <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:18,marginTop:"var(--hero-gallery-controls-mt,86px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,height:controlH,padding:"0 var(--hero-gallery-pill-pad-x,20px)",borderRadius:999,background:isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)"}}>
          {HERO_GALLERY.map((_,i)=>{
            const isActive=active===i;
            const staticSelected=!playing&&!ended&&elapsedMs===0&&isActive;
            const progressDelay=`-${Math.min(elapsedMs,HERO_GALLERY_AUTOPLAY_MS)}ms`;
            return(
              <button
                key={i}
                aria-label={`Ir a tarjeta ${i+1}`}
                onClick={()=>onPickSlide(i)}
                style={{border:"none",padding:0,width:isActive?activeDotW:dotSize,height:dotSize,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",cursor:"pointer"}}>
                {isActive?(
                  <div style={{position:"relative",width:activeDotW,height:dotSize,borderRadius:999,overflow:"hidden",background:isDark?"rgba(255,255,255,.24)":"rgba(0,0,0,.18)"}}>
                    <div
                      key={`${active}-${ended}-${playing}-${Math.round(elapsedMs)}`}
                      style={{
                        position:"absolute",
                        left:0,
                        top:0,
                        bottom:0,
                        width:ended?"100%":(staticSelected?"42%":"0%"),
                        borderRadius:999,
                        background:isDark?"#f5f5f7":"#1d1d1f",
                        animation:ended||staticSelected?"none":`heroProgFill ${HERO_GALLERY_AUTOPLAY_MS}ms linear forwards`,
                        animationDelay:progressDelay,
                        animationPlayState:playing?"running":"paused",
                      }}
                    />
                  </div>
                ):(
                  <span style={{display:"block",width:dotSize,height:dotSize,borderRadius:"50%",background:isDark?"rgba(255,255,255,.76)":"rgba(0,0,0,.36)"}}/>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={onTogglePlay} aria-label={ended?"Reiniciar galeria":(playing?"Pausar galeria":"Reproducir galeria")}
          onMouseEnter={()=>setPlayHover(true)}
          onMouseLeave={()=>setPlayHover(false)}
          onFocus={()=>setPlayHover(true)}
          onBlur={()=>setPlayHover(false)}
          style={{width:controlH,height:controlH,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:playHover?"rgba(100,100,110,.8)":"rgba(74,74,84,.72)",color:"#f5f5f7",transition:"background .24s ease"}}>
          {ended?<IcoReplay s={iconMain} c="#f5f5f7"/>:(playing?<IcoPause s={iconPause} c="#f5f5f7"/>:<IcoPlay s={iconMain} c="#f5f5f7"/>)}
        </button>
      </div>
    </section>
  );
}





