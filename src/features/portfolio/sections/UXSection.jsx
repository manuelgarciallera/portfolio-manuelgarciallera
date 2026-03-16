import { useEffect, useRef } from "react";
import { IMGS, FBK } from "../content";
import { SmartImage as Img } from "../SmartImage";

export function UXSection({isDark,C,prefRM,wrapRef}){
  const canvasRef=useRef(null);
  const sectionRef=useRef(null);
  useEffect(()=>{
    const c=canvasRef.current;if(!c||prefRM.current)return;
    let visible=true;
    const ctx=c.getContext("2d");
    let pts=[];
    const N=380;

    const init=()=>{
      c.width=c.offsetWidth;c.height=c.offsetHeight;
      pts=Array.from({length:N},(_,i)=>({
        x:Math.random()*c.width,
        y:Math.random()*c.height,
        hx:0,hy:0, // home position assigned after creation
        vx:(Math.random()-.5)*.3,
        vy:(Math.random()-.5)*.3,
        r:Math.random()*2.5+2,
        hue:190+Math.random()*20,
        bright: i<18,
      }));
      // Save initial position as "home"
      pts.forEach(p=>{p.hx=p.x;p.hy=p.y;});
    };
    const ro=new ResizeObserver(init);ro.observe(c);init();

    const mouse={x:-999,y:-999};
    const onM=e=>{const r=c.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;};
    const onL=()=>{mouse.x=-999;mouse.y=-999;};
    const sec=c.parentElement;
    sec.addEventListener("mousemove",onM,{passive:true});
    sec.addEventListener("mouseleave",onL);
    const io=new IntersectionObserver(
      e=>{visible=e[0]?.isIntersecting ?? true;},
      {root:wrapRef?.current ?? null,threshold:.08,rootMargin:"220px 0px 220px 0px"}
    );
    if(sectionRef.current)io.observe(sectionRef.current);

    let t=0,raf;
    const draw=()=>{
      raf=requestAnimationFrame(draw);
      if(!visible)return;
      t+=.00012;
      const{width:w,height:h}=c;
      ctx.clearRect(0,0,w,h);

      pts.forEach((p,i)=>{
        // Organic flow field
        const fi=i*0.43;
        const baseX=Math.sin(t*0.11+fi*0.2)*0.022+Math.cos(t*0.07+fi*0.15)*0.014;
        const baseY=Math.cos(t*0.09+fi*0.18)*0.018+Math.sin(t*0.06+fi*0.22)*0.012;
        const gust=0.6+Math.sin(t*0.18+fi*0.9)*0.3+Math.cos(t*0.13+fi*1.1)*0.2;
        p.vx+=baseX*gust;
        p.vy+=baseY*gust;

        // Mouse: notable repulsion
        const mdx=p.x-mouse.x,mdy=p.y-mouse.y;
        const md=Math.sqrt(mdx*mdx+mdy*mdy)||1;
        if(md<140){
          const f=1.1*(1-md/140)*(1-md/140);
          p.vx+=mdx/md*f;
          p.vy+=mdy/md*f;
        }

        // Return to home: smooth force toward original position
        // Only acts when particles are far enough from home
        const hDist=Math.sqrt((p.x-p.hx)**2+(p.y-p.hy)**2);
        if(hDist>8){
          p.vx+=(p.hx-p.x)*0.0018;
          p.vy+=(p.hy-p.y)*0.0018;
        }

        p.vx*=.97; p.vy*=.97;
        const spd=Math.sqrt(p.vx*p.vx+p.vy*p.vy)||1;
        if(spd>0.9){p.vx=p.vx/spd*0.9;p.vy=p.vy/spd*0.9;}

        p.x+=p.vx; p.y+=p.vy;

        // Home drifts very slowly with the flow field
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
    return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();sec.removeEventListener("mousemove",onM);sec.removeEventListener("mouseleave",onL);};
  },[prefRM,wrapRef]);

  // Foreground layer: flock that opens/closes and reacts to mouse
  const fgRef=useRef(null);
  const sharedMouse=useRef({x:-999,y:-999});
  useEffect(()=>{
    const c=fgRef.current;if(!c||prefRM.current)return;
    let visible=true;
    const ctx=c.getContext("2d");
    const N=110;
    let pts=[];

    const init=()=>{
      c.width=c.offsetWidth;c.height=c.offsetHeight;
      const cx=c.width*0.5,cy=c.height*0.5;
      pts=Array.from({length:N},()=>({
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
    const io=new IntersectionObserver(
      e=>{visible=e[0]?.isIntersecting ?? true;},
      {root:wrapRef?.current ?? null,threshold:.08,rootMargin:"220px 0px 220px 0px"}
    );
    if(sectionRef.current)io.observe(sectionRef.current);

    let t=0,raf2;
    const draw=()=>{
      raf2=requestAnimationFrame(draw);
      if(!visible)return;
      t+=.0006;
      const{width:w,height:h}=c;
      ctx.clearRect(0,0,w,h);
      const mouse=sharedMouse.current;

      // centro de masa del grupo
      let gcx=0,gcy=0;
      pts.forEach(p=>{gcx+=p.x;gcy+=p.y;});
      gcx/=N; gcy/=N;

      // Pulse: the group expands and contracts rhythmically
      const pulse=Math.sin(t*1.4)*0.00045+0.0008;

      pts.forEach((p,i)=>{
        const fi=i*0.55;

        // Smooth organic drift
        p.vx+=Math.sin(t*0.9+fi*0.3)*0.018+Math.cos(t*0.7+fi*0.5)*0.012;
        p.vy+=Math.cos(t*0.8+fi*0.4)*0.018+Math.sin(t*0.6+fi*0.6)*0.012;

        // Cohesion toward the group center
        p.vx+=(gcx-p.x)*pulse;
        p.vy+=(gcy-p.y)*pulse;

        // Minimum separation
        pts.forEach(q=>{
          if(q===p)return;
          const dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy)||1;
          if(d<22){p.vx+=dx/d*0.12;p.vy+=dy/d*0.12;}
        });

        // Mouse: strong obstacle
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

        // Draw: size based on distance to center
        const dx=p.x-gcx, dy=p.y-gcy;
        const distG=Math.sqrt(dx*dx+dy*dy);
        const norm=Math.min(distG/140,1); // 0=center, 1=periphery
        const rD=(p.r*3.2)*(1-norm*0.78)+p.r*0.6; // center ~x3.2, periphery ~x0.6
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
    return()=>{cancelAnimationFrame(raf2);ro.disconnect();io.disconnect();sec.removeEventListener("mousemove",onM);sec.removeEventListener("mouseleave",onL);};
  },[prefRM,wrapRef]);

  return(
    <section ref={sectionRef} style={{padding:"var(--sec-pad-y,130px) var(--page-pad-x,28px)",background:isDark?"#000":"#fff",position:"relative",overflow:"hidden",transition:"background .5s"}}>
      <canvas ref={canvasRef} className="sec-canvas" aria-hidden="true"/>
      <canvas ref={fgRef} className="sec-canvas" style={{zIndex:1}} aria-hidden="true"/>
      <div style={{maxWidth:980,margin:"0 auto",position:"relative",zIndex:2,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"52px 80px",alignItems:"center"}}>
        <div>
          <p className="rv" style={{fontSize:12,color:C.teal,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:20}}>UX \u00b7 UI \u00b7 Product Design</p>
          <div style={{overflow:"hidden",marginBottom:22}}>
            <h2 className="clip-rv ttl-rv" style={{fontSize:"clamp(30px,4.8vw,58px)",fontWeight:700,letterSpacing:"-.04em",lineHeight:1.06}}>
              <span className={isDark?"acc-dk":"acc-lt"}>Interfaces que enamoran.</span>
            </h2>
          </div>
          <p className="rv2" style={{transitionDelay:".16s",fontSize:17,color:C.textSec,lineHeight:1.72,marginBottom:32}}>
            Once a\u00f1os dise\u00f1ando para millones de personas. Metodolog\u00edas de investigaci\u00f3n aplicadas a productos de alto impacto. LALIGA, deporte global, plataformas de referencia.
          </p>
          <div className="rv2" style={{transitionDelay:".28s",display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className={isDark?"btn-dk":"btn-lt"}>Ver proyectos UX \u00b7 UI</button>
            <button className={`btn-ghost-${isDark?"dk":"lt"}`}>Metodolog\u00eda \u2192</button>
          </div>
        </div>
        <div className="rs" style={{transitionDelay:".1s",borderRadius:18,overflow:"hidden",background:isDark?"#1c1c1e":"#fff",border:`1px solid ${C.divider}`,boxShadow:isDark?"none":"0 4px 24px rgba(0,0,0,.09)"}}>
          <Img src={IMGS[0]} fb={FBK[0]} alt="UX UI LALIGA" sizes="(max-width: 920px) 100vw, 420px" style={{height:280}}/>
          <div style={{padding:"20px 22px 24px"}}>
            <div style={{fontSize:10.5,color:C.teal,letterSpacing:".08em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Product Design \u00b7 LALIGA</div>
            <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:6,letterSpacing:"-.025em"}}>App LALIGA \u00b7 20M+ usuarios</div>
            <div style={{fontSize:13.5,color:C.textSec,letterSpacing:"-.01em"}}>UX Research \u00b7 Design System \u00b7 Prototyping</div>
          </div>
        </div>
      </div>
    </section>
  );
}
// (Effect also saved for individual Full Stack page)


