import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CLOSE_LOOK_ITEMS } from "../content";
import { ChD, ChU, IcoClose } from "../icons";
import { SmartImage as Img } from "../SmartImage";
import { clampRange } from "../utils";

export function CloseLookSection({ isDark, prefRM, alignLeft = 0 }){
  const [active,setActive]=useState(0);
  const [open,setOpen]=useState(-1);
  const [hovered,setHovered]=useState(-1);
  const [xHover,setXHover]=useState(false);
  const [arrowHover,setArrowHover]=useState("");
  const panelRef=useRef(null);
  const mediaRef=useRef(null);
  const [panelW,setPanelW]=useState(1120);
  const [panelH,setPanelH]=useState(800);
  const items=CLOSE_LOOK_ITEMS;
  const n=items.length;

  useEffect(()=>{
    const el=panelRef.current;if(!el)return;
    const measure=()=>{
      setPanelW(el.clientWidth||1120);
      setPanelH(el.clientHeight||800);
    };
    measure();
    const ro=new ResizeObserver(measure);ro.observe(el);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    CLOSE_LOOK_ITEMS.slice(0,2).forEach(({src})=>{
      const img=new Image();
      img.decoding="async";
      img.src=src;
      if(img.decode){img.decode().catch(()=>{});}
    });
  },[]);

  const select=useCallback((i,shouldOpen=true)=>{
    const next=(i+n)%n;
    setActive(next);
    setOpen(shouldOpen?next:-1);
  },[n]);

  const onItem=useCallback((i)=>{
    if(open===i){setOpen(-1);setActive(i);return;}
    select(i,true);
  },[open,select]);

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
  const uiScale=wide?clampRange(.86,panelH/760,1):1;
  const s=v=>Math.round(v*uiScale*100)/100;
  const mediaItem=items[active];
  const listLeft=wide?s(118):16;
  const listTop=wide?s(48):20;
  const descWidth=wide?Math.min(s(480),Math.max(s(360),panelW*.33)):0;
  const descMax=Math.max(wide?s(340):340,panelW-listLeft-(wide?s(28):28));
  const ctrlSize=wide?s(36):32;
  const arrowIconSize=wide?Math.max(16,Math.round(s(20))):20;
  const closeIconSize=wide?Math.max(14,Math.round(s(18))):18;
  const pillGap=wide?s(14):14;
  const titleMb=wide?s(42):42;
  const titleMl=wide?Math.round(alignLeft):0;
  const clipRadius=wide?Math.round(s(12)):12;
  const motionEase=[0.22,0.61,0.36,1];
  const bubbleBezier=[0.22,0.61,0.36,1];
  const morphMs=prefRM.current?0:.62;
  const bubbleOpenMs=morphMs;
  const bubbleCloseMs=morphMs;
  const labelOutTransition=prefRM.current?{duration:0}:{type:"tween",duration:.18,ease:[0.55,0,1,1]};
  const labelInTransition=prefRM.current?{duration:0}:{type:"tween",duration:.26,ease:motionEase,delay:.2};
  const descInTransition=prefRM.current?{duration:0}:{type:"tween",duration:.3,ease:motionEase,delay:.24};
  const descOutTransition=prefRM.current?{duration:0}:{type:"tween",duration:.18,ease:[0.55,0,1,1]};
  const mediaTransition=prefRM.current?{duration:0}:{type:"tween",duration:morphMs,ease:motionEase};
  const textClipClosed=`inset(0 50% 0 50% round ${clipRadius}px)`;
  const textClipOpen=`inset(0 0% 0 0% round ${clipRadius}px)`;

  return(
    <section style={{padding:wide?"var(--close-look-pad-top,10px) var(--page-pad-x,28px) var(--close-look-pad-bottom,170px)":"26px 16px 112px",background:isDark?"#1c1c24":"#f0f0f3",transition:"background .5s",height:wide?"var(--close-look-section-h,auto)":"auto",boxSizing:"border-box",overflow:wide?"hidden":"visible"}}>
      <div style={{maxWidth:1420,margin:"0 auto"}}>
        <h2 className={`ttl-rv ${isDark?"acc-dk":"acc-lt"}`} style={{fontSize:"clamp(34px,4vw,52px)",fontWeight:700,letterSpacing:"-.03em",lineHeight:1.04,marginBottom:wide?"var(--close-look-title-mb,42px)":titleMb,marginLeft:titleMl}}>
          {"M\u00E1s de cerca."}
        </h2>

        <div ref={panelRef} style={{
          borderRadius:wide?s(30):30,
          overflow:"hidden",
          background:"#000",
          border:"none",
          padding:0,
        }}>
          <div style={{position:"relative",minHeight:wide?"var(--close-look-panel-h,800px)":880}}>
            <div
              ref={mediaRef}
              onMouseMove={onMove}
              onMouseLeave={onLeave}
              style={{
                position:"absolute",
                inset:0,
                transform:"scale(1) rotateX(0deg) rotateY(0deg)",
                transformStyle:"preserve-3d",
                transition:"transform .24s ease,box-shadow .35s ease",
                background:"#0b0b10",
              }}>
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={mediaItem.src}
                  initial={prefRM.current?false:{opacity:0,x:"2.6%",scale:1.015}}
                  animate={{opacity:1,x:"0%",scale:1}}
                  exit={prefRM.current?{opacity:0}:{opacity:[1,.7,0],x:"-2.6%",scale:.99}}
                  transition={mediaTransition}
                  style={{
                    position:"absolute",
                    inset:0,
                    willChange:"transform,opacity",
                    transform:"translateZ(0)",
                    backfaceVisibility:"hidden",
                  }}>
                  <Img src={mediaItem.src} fb="linear-gradient(135deg,#101821,#1b293f)" alt={mediaItem.label} loading="eager" fetchPriority="high" sizes="(max-width: 980px) 100vw, 1420px" style={{transform:"scale(1.02)"}}/>
                </motion.div>
              </AnimatePresence>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.12) 0%,rgba(0,0,0,.05) 46%,rgba(0,0,0,.42) 100%)"}}/>
            </div>

            <div style={{position:"absolute",inset:0,background:wide?"linear-gradient(90deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,.52) 24%,rgba(0,0,0,.2) 45%,rgba(0,0,0,.05) 70%,rgba(0,0,0,.14) 100%)":"linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.25) 38%,rgba(0,0,0,.35) 100%)",pointerEvents:"none"}}/>

            {open!==-1&&(
              <button onClick={()=>setOpen(-1)} aria-label="Cerrar descripcion"
                onMouseEnter={()=>setXHover(true)}
                onMouseLeave={()=>setXHover(false)}
                style={{position:"absolute",top:wide?s(26):26,right:wide?s(26):26,zIndex:15,width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,background:xHover?"rgba(24,24,30,.96)":"rgba(42,42,48,.9)",color:"#d8d8df",transition:"background .24s ease"}}>
                <IcoClose s={closeIconSize} c="#d8d8df"/>
              </button>
            )}

            <div style={{position:"absolute",left:listLeft,top:wide?"50%":listTop,transform:wide?"translateY(-50%)":"none",zIndex:10,width:wide?s(430):"calc(100% - 32px)"}}>
              {wide&&(
                <div style={{position:"absolute",left:-s(74),top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:s(30)}}>
                  <button onClick={()=>select(active-1,true)} aria-label="Categoria anterior"
                    onMouseEnter={()=>setArrowHover("desk-up")}
                    onMouseLeave={()=>setArrowHover("")}
                    onFocus={()=>setArrowHover("desk-up")}
                    onBlur={()=>setArrowHover("")}
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:arrowHover==="desk-up"?"rgba(100,100,110,.8)":"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)",transition:"background .24s ease"}}>
                    <ChU s={arrowIconSize}/>
                  </button>
                  <button onClick={()=>select(active+1,true)} aria-label="Categoria siguiente"
                    onMouseEnter={()=>setArrowHover("desk-down")}
                    onMouseLeave={()=>setArrowHover("")}
                    onFocus={()=>setArrowHover("desk-down")}
                    onBlur={()=>setArrowHover("")}
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:arrowHover==="desk-down"?"rgba(100,100,110,.8)":"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)",transition:"background .24s ease"}}>
                    <ChD s={arrowIconSize}/>
                  </button>
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:pillGap}}>
                  {items.map((item,i)=>{
                    const isOn=active===i;
                    const expanded=open===i;
                    const isHover=hovered===i;
                    const collapsedW=Math.min(descMax,wide?Math.max(s(188),Math.round((106+item.label.length*9.8)*uiScale)):Math.max(176,Math.round(98+item.label.length*9.4)));
                    const expandedW=wide?Math.min(descWidth,descMax):Math.min(descMax,Math.max(284,panelW-34));
                    const collapsedH=wide?s(54):54;
                    const expandedH=wide
                      ?Math.min(s(226),Math.max(s(136),Math.round((102+Math.ceil(item.desc.length/44)*22)*uiScale)))
                      :Math.min(252,Math.max(146,106+Math.ceil(item.desc.length/36)*23));
                    const bubbleBg=expanded
                      ?"rgba(30,30,36,.78)"
                      :isHover
                        ?(isOn?"rgba(98,98,108,.84)":"rgba(88,88,98,.8)")
                        :(isOn?"rgba(76,76,86,.78)":"rgba(64,64,74,.72)");
                    return(
                      <div key={item.label} style={{display:"flex"}}>
                        <motion.button
                          transition={prefRM.current?{duration:0}:{type:"tween",duration:expanded ? bubbleOpenMs : bubbleCloseMs,ease:bubbleBezier}}
                          animate={{
                            width:expanded?expandedW:collapsedW,
                            height:expanded?expandedH:collapsedH,
                            borderRadius:expanded?s(22):Math.round(collapsedH/2),
                          }}
                          onClick={()=>onItem(i)}
                          aria-expanded={expanded}
                          aria-label={`${expanded?"Cerrar":"Abrir"} ${item.label}`}
                          onMouseEnter={()=>setHovered(i)}
                          onMouseLeave={()=>setHovered(-1)}
                          onFocus={()=>setHovered(i)}
                          onBlur={()=>setHovered(-1)}
                          whileTap={undefined}
                          style={{
                            maxWidth:"100%",
                            height:collapsedH,
                            border:"none",
                            background:bubbleBg,
                            boxShadow:"none",
                            display:"block",
                            cursor:"pointer",
                            position:"relative",
                            padding:0,
                            color:"#f5f5f7",
                            textAlign:"left",
                            letterSpacing:"-.015em",
                            transition:"background .2s ease,opacity .2s ease",
                            backdropFilter:"none",
                            transformOrigin:"left center",
                            transform:"translateZ(0)",
                            backfaceVisibility:"hidden",
                            opacity:open===-1||expanded||!isOn?1:.65,
                            overflow:"hidden",
                            willChange:"width,height,border-radius,transform",
                          }}>
                          <motion.div
                            transition={expanded?labelOutTransition:labelInTransition}
                            animate={{
                              opacity:expanded?0:1,
                              scale:expanded?.99:1,
                              y:0,
                              filter:expanded?"blur(2.2px)":"blur(0px)",
                              clipPath:expanded?textClipClosed:textClipOpen,
                            }}
                            style={{position:"absolute",inset:0,padding:wide?`${s(15)}px ${s(18)}px`:"14px 14px",display:"flex",alignItems:"center",justifyContent:"flex-start",overflow:"hidden",transformOrigin:"left center",willChange:"opacity,filter,clip-path"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"flex-start",gap:wide?s(10):10,whiteSpace:"nowrap"}}>
                              <span style={{
                                width:wide?s(25):25,
                                height:wide?s(25):25,
                                borderRadius:"50%",
                                border:`${wide?s(1.8):1.8}px solid #fff`,
                                display:"inline-flex",
                                alignItems:"center",
                                justifyContent:"center",
                                fontSize:wide?s(20):20,
                                fontWeight:650,
                                color:"#fff",
                                background:isOn||isHover?"rgba(255,255,255,.14)":"transparent",
                                flexShrink:0,
                                lineHeight:1,
                              }}>
                                +
                              </span>
                              <span style={{fontSize:wide?s(16.25):14.55,fontWeight:610,lineHeight:1.08}}>{item.label}</span>
                            </div>
                          </motion.div>

                          <motion.div
                            transition={expanded?descInTransition:descOutTransition}
                            animate={{
                              opacity:expanded?1:0,
                              scale:expanded?1:.99,
                              y:0,
                              filter:expanded?"blur(0px)":"blur(2.6px)",
                              clipPath:expanded?textClipOpen:textClipClosed,
                            }}
                            style={{position:"absolute",inset:0,padding:wide?`${s(15)}px ${s(17)}px`:"14px 14px",overflow:"hidden",transformOrigin:"left center",pointerEvents:expanded?"auto":"none",willChange:"opacity,filter,clip-path"}}>
                            <div style={{
                              fontSize:wide?s(17):15,
                              fontWeight:500,
                              lineHeight:1.46,
                              letterSpacing:"-.01em",
                              color:"rgba(245,245,247,.95)",
                            }}>
                              <span style={{fontWeight:640,color:"#f5f5f7"}}>{item.label}. </span>
                              <span style={{fontWeight:460,color:"rgba(245,245,247,.9)"}}>{item.desc}</span>
                            </div>
                          </motion.div>
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

              {!wide&&(
                <div style={{display:"flex",gap:10,marginTop:12}}>
                  <button onClick={()=>select(active-1,true)} aria-label="Categoria anterior"
                    onMouseEnter={()=>setArrowHover("mob-up")}
                    onMouseLeave={()=>setArrowHover("")}
                    onFocus={()=>setArrowHover("mob-up")}
                    onBlur={()=>setArrowHover("")}
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:arrowHover==="mob-up"?"rgba(100,100,110,.8)":"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)",transition:"background .24s ease"}}>
                    <ChU s={20}/>
                  </button>
                  <button onClick={()=>select(active+1,true)} aria-label="Categoria siguiente"
                    onMouseEnter={()=>setArrowHover("mob-down")}
                    onMouseLeave={()=>setArrowHover("")}
                    onFocus={()=>setArrowHover("mob-down")}
                    onBlur={()=>setArrowHover("")}
                    style={{width:ctrlSize,height:ctrlSize,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:arrowHover==="mob-down"?"rgba(100,100,110,.8)":"rgba(30,30,34,.86)",color:"#f5f5f7",backdropFilter:"blur(6px)",transition:"background .24s ease"}}>
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



