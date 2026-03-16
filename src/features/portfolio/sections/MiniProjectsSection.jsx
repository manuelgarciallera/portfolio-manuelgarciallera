import { ChR } from "../icons";
import { SmartImage as Img } from "../SmartImage";

export function MiniProjects({isDark,C,projects,alt}){
  return(
    <section style={{padding:"var(--sec-pad-y-sm,72px) var(--page-pad-x,28px)",background:alt?(isDark?"#000":"#fff"):(isDark?"#111114":"#f5f5f7"),transition:"background .5s",borderTop:`1px solid ${C.divider}`,borderBottom:`1px solid ${C.divider}`}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
          <p style={{fontSize:12,color:C.textSec,letterSpacing:".08em",textTransform:"uppercase",fontWeight:500}}>
            {alt?"Proyectos destacados":"M\u00e1s trabajo"}
          </p>
          <button className={isDark?"btn-dk":"btn-lt"} style={{fontSize:12.5,padding:"7px 18px"}}>
            Ver todos \u2192
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
          {projects.map((p,i)=>(
            <div key={`${p.id}-${i}`} className={`rs ${isDark?"card-dk":"card-lt"}`} style={{transitionDelay:`${i*.1}s`}}>
              <div style={{height:160,overflow:"hidden",position:"relative"}}>
                <Img src={p.src} fb={p.fb} alt={p.title} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 320px"/>
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

