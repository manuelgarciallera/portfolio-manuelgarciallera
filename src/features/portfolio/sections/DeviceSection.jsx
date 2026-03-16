import { useEffect, useRef } from "react";
import { ChR } from "../icons";

export function DeviceSection({isDark,C,wrapRef,prefRM}){
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
  },[prefRM,wrapRef]);
  const fl=isDark;
  return(
    <section ref={secRef} style={{padding:"var(--sec-pad-y,130px) var(--page-pad-x,28px)",background:isDark?"#0a0a0b":"#f5f5f7",transition:"background .5s",overflow:"hidden"}}>
      <div style={{maxWidth:980,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:"52px 80px",alignItems:"center"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:18}}>UX \u00b7 Product Design</p>
          <div style={{overflow:"hidden",marginBottom:20}}><h2 className="clip-rv ttl-rv" style={{fontSize:"clamp(26px,4vw,50px)",fontWeight:700,letterSpacing:"-.036em",lineHeight:1.1}}><span style={{color:C.text}}>Dise\u00f1o que vive<br/>en </span><span className={isDark?"acc-dk":"acc-lt"}>los dedos.</span></h2></div>
          <p className="rv2" style={{transitionDelay:".14s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:34}}>Interfaces intuitivas desde el primer toque. Once a\u00f1os dise\u00f1ando para millones de personas en el deporte global.</p>
          <div className="rv2" style={{transitionDelay:".28s"}}><button className={isDark?"btn-dk":"btn-lt"}>Ver proyectos UX \u2192</button></div>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"var(--device-min-h,540px)"}}>
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
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,fontSize:11,color:"rgba(255,255,255,.4)",fontWeight:600}}><span>9:41</span><span style={{fontSize:9}}>\u25cf\u25cf\u25cf\u25cf WiFi</span></div>
                  <div style={{fontSize:21,fontWeight:700,color:"#fff",marginBottom:2,letterSpacing:"-.03em"}}>LALIGA</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.28)",marginBottom:18}}>Temporada 2025\u201326</div>
                  <div style={{borderRadius:14,padding:"13px 14px",marginBottom:10,background:"rgba(94,196,200,.09)",border:"1px solid rgba(94,196,200,.18)"}}>
                    <div style={{fontSize:9.5,color:"#5ec4c8",fontWeight:700,letterSpacing:".07em",marginBottom:7,textTransform:"uppercase"}}>\u2b24 En directo</div>
                    <div style={{fontSize:13.5,fontWeight:700,color:"#fff"}}>Real Madrid 2 \u2013 1 Bar\u00e7a</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.32)",marginTop:3}}>Min 73&apos; \u00b7 Santiago Bernab\u00e9u</div>
                  </div>
                  {[{t:"Atl\u00e9tico 1-0 Sevilla",s:"Final",e:"\ud83d\udd34"},{t:"Clasificaci\u00f3n \u00b7 J30",s:"Ver tabla",e:"\ud83d\udcca"},{t:"Mbapp\u00e9 \u2014 15 goles",s:"Top goleador",e:"\u2b50"}].map((item,i)=>(
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
