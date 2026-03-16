import { useEffect, useRef } from "react";
import * as THREE from "three";
import { IMGS, FBK } from "../content";
import { SmartImage as Img } from "../SmartImage";

export function ArchSection({isDark,C,prefRM}){
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
  },[prefRM]);
  return(
    <section ref={secRef} style={{padding:"var(--sec-pad-y,130px) var(--page-pad-x,28px)",background:isDark?"#0a0a0b":"#f5f5f7",position:"relative",overflow:"hidden",transition:"background .5s"}}>
      <canvas ref={canvasRef} className="sec-canvas"/>
      <div style={{maxWidth:980,margin:"0 auto",position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"52px 80px",alignItems:"center"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:20}}>3D \u00b7 Arquitectura</p>
          <div style={{overflow:"hidden",marginBottom:22}}>
            <h2 className="clip-rv ttl-rv" style={{fontSize:"clamp(30px,4.8vw,58px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}>
              <span className={isDark?"acc-dk":"acc-lt"}>Del plano al fotorrealismo.</span>
            </h2>
          </div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:32}}>
            Pipeline completo desde SketchUp. Modelado arquitect\u00f3nico, baking en Blender, renders est\u00e1ticos en UE5 y Twinmotion 2025. Visualizaci\u00f3n 3D interactiva para web.
          </p>
          <div className="rv2" style={{transitionDelay:".28s",display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className={isDark?"btn-dk":"btn-lt"}>Ver renders 3D</button>
            <button className={`btn-ghost-${isDark?"dk":"lt"}`}>Pipeline \u2192</button>
          </div>
        </div>
        <div className="rs" style={{transitionDelay:".1s",borderRadius:18,overflow:"hidden",background:isDark?"#1c1c1e":"#fff",border:`1px solid ${C.divider}`,boxShadow:isDark?"none":"0 4px 24px rgba(0,0,0,.09)"}}>
          <Img src={IMGS[1]} fb={FBK[1]} alt="Estadio 3D" style={{height:280}}/>
          <div style={{padding:"20px 22px 24px"}}>
            <div style={{fontSize:10.5,color:C.teal,letterSpacing:".08em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Visualizaci\u00f3n arquitect\u00f3nica</div>
            <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:6,letterSpacing:"-.025em"}}>Estadio \u00b7 SketchUp \u2192 UE5</div>
            <div style={{fontSize:13.5,color:C.textSec,letterSpacing:"-.01em"}}>Render fotorrealista 4K \u00b7 Lumen GI \u00b7 Nanite</div>
          </div>
        </div>
      </div>
    </section>
  );
}


