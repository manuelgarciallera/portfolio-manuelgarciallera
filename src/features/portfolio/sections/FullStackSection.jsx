import { useEffect, useRef } from "react";
import * as THREE from "three";

export function FullStackSection({isDark,C,prefRM,wrapRef}){
  const canvasRef=useRef(null);
  const sectionRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||prefRM.current)return;
    let visible=true;
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
    const io=new IntersectionObserver(
      e=>{visible=e[0]?.isIntersecting ?? true;},
      {root:wrapRef?.current ?? null,threshold:.08,rootMargin:"200px 0px 200px 0px"}
    );
    if(sectionRef.current)io.observe(sectionRef.current);
    let t=0,raf;
    const tick=()=>{raf=requestAnimationFrame(tick);if(!visible)return;t+=.006;pts.rotation.y=t*.08;pts.rotation.x=Math.sin(t*.3)*.06;renderer.render(scene,camera);};tick();
    return()=>{cancelAnimationFrame(raf);geo.dispose();pMat.dispose();lGeo.dispose();lMat.dispose();renderer.dispose();ro.disconnect();io.disconnect();};
  },[prefRM,wrapRef]);
  const stack=[["Angular 17+","React 18","TypeScript"],["Node.js","Express","MongoDB"],["MySQL","REST APIs","Three.js"],["UE5","Blender","SketchUp"]];
  return(
    <section ref={sectionRef} style={{padding:"var(--sec-pad-y,130px) var(--page-pad-x,28px)",background:isDark?"#0a0a0b":"#f5f5f7",position:"relative",overflow:"hidden",transition:"background .5s"}}>
      <canvas ref={canvasRef} className="sec-canvas" aria-hidden="true"/>
      <div style={{maxWidth:980,margin:"0 auto",position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"52px 80px",alignItems:"start"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:20}}>Full Stack \u00b7 Dev</p>
          <div style={{overflow:"hidden",marginBottom:22}}>
            <h2 className="clip-rv ttl-rv" style={{fontSize:"clamp(30px,4.8vw,58px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}>
              <span style={{color:C.text}}>Del dise\u00f1o al </span><span className={isDark?"acc-dk":"acc-lt"}>c\u00f3digo real.</span>
            </h2>
          </div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:32}}>
            Angular 17+ con Signals, Node.js, MongoDB y MySQL. Arquitecturas escalables que van de la idea al deploy, integrando 3D y visualizaci\u00f3n interactiva.
          </p>
          <div className="rv2" style={{transitionDelay:".28s",display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className={isDark?"btn-dk":"btn-lt"}>Ver proyectos dev</button>
            <button className={`btn-ghost-${isDark?"dk":"lt"}`}>Stack completo \u2192</button>
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


