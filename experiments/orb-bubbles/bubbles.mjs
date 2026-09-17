// Throwaway visual prototype. CSS-pixel coordinates; no dependency on the orb GPU.
export function createEmitter(random=Math.random){
 const particles=[]
 let previous=null,lastBurst=-Infinity,lastTick=null
 return {
  particles,
  clear(){particles.length=0;previous=null;lastTick=null;lastBurst=-Infinity},
  move(x,y,now,inside){
   const prior=previous;previous={x,y,now,inside}
   if(!prior||(!inside&&!prior.inside))return
   const dt=now-prior.now,dx=x-prior.x,dy=y-prior.y,distance=Math.hypot(dx,dy)
   if(dt<4||dt>350||distance/dt<.7||now-lastBurst<85)return
   lastBurst=now
   const direction=Math.atan2(dy,dx),speed=Math.min(1050,Math.max(480,distance/dt*430))
   for(let i=0;i<5&&particles.length<28;i++){
    const angle=direction+(random()-.5)*.24,velocity=speed*(.74+random()*.3)
    particles.push({x:(inside?x:prior.x)-Math.cos(direction)*i*10,y:(inside?y:prior.y)-Math.sin(direction)*i*10+(random()-.5)*18,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,
     radius:3+random()*6,born:now,life:1900+random()*650,hit:null,alpha:0,hue:24+random()*16})
   }
   if(lastTick===null)lastTick=now
  },
  tick(now,letters=[]){
   const dt=Math.min(.05,Math.max(0,(now-(lastTick??now))/1000));lastTick=now
   for(let i=particles.length-1;i>=0;i--){
    const p=particles[i],age=now-p.born
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-.36*dt);p.vy-=12*dt
    if(p.hit===null&&letters.some(r=>p.x+p.radius>=r.left&&p.x-p.radius<=r.right&&p.y+p.radius>=r.top&&p.y-p.radius<=r.bottom))p.hit=now
    const dissolve=p.hit===null?1:Math.max(0,1-(now-p.hit)/300)
    p.alpha=.72*Math.min(1,age/80)*Math.max(0,1-age/p.life)**.7*dissolve
    if(age>=p.life||dissolve===0)particles.splice(i,1)
   }
   if(!particles.length)lastTick=null
  },
 }
}
