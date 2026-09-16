// Approved organic prototype 095e2ba. Procedural appearance, not fluid physics.
export const ORB_VERTEX = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`
export const ORB_FRAGMENT = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform float lightTheme;
    uniform float cameraZoom;
    uniform float verticalOffset;
    uniform vec2 pressPoint;
    uniform float pressAge;
    uniform float pressStrength;
    mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
    vec3 local(vec3 p){p.y-=.055*sin(time*.65);p.xy=turn(time*.1)*p.xy;p.xz=turn(.3+time*.025)*p.xz;return p;}
    float merge(float a,float b,float k){
      float h=clamp(.5+.5*(b-a)/k,0.,1.);
      return mix(b,a,h)-k*h*(1.-h);
    }
    float shape(vec3 p){
      vec2 surfacePoint=p.xy;
      p=local(p);
      float waves=sin(p.x*3.+time*.52)*sin(p.y*3.4-time*.41)*sin(p.z*3.1+time*.45);
      float body=length(p)-.96-.085*waves;
      // Smooth unions keep the emerging liquid attached until it folds back in.
      for(int i=0;i<3;i++){
        float f=float(i), phase=time*.8+f*2.1;
        float reach=.5+.5*sin(phase);
        float angle=f*2.094+.3*sin(time*.24+f);
        vec3 direction=normalize(vec3(cos(angle),sin(angle),.18*sin(f+time*.3)));
        vec3 tip=direction*(.78+.4*reach);
        body=merge(body,length(p-tip)-(.13+.055*reach),.22);
      }
      // Five modest droplets leave the skin, drift briefly and rejoin it.
      for(int i=0;i<5;i++){
        float f=float(i), pulse=.5+.5*sin(time*.7+f*1.7);
        float angle=f*1.2566+.5+time*.065;
        vec3 direction=normalize(vec3(cos(angle),sin(angle),.15*cos(f*2.)));
        vec3 center=direction*(.88+.43*pulse);
        float radius=.024+.014*(.5+.5*sin(f*3.));
        body=merge(body,length(p-center)-radius,.035);
      }
      if(pressStrength>.001){
        float radius=length(surfacePoint-pressPoint);
        body+=.12*pressStrength*cos(radius*10.-pressAge*7.)*exp(-radius*3.);
      }
      return body;
    }
    float current(vec3 p){
      p.xz=turn(.9*sin(p.y*2.+time*.16))*p.xz;
      p+=.32*sin(p.yzx*3.+vec3(time*.36,-time*.3,time*.24));
      return sin(p.x*9.+p.y*4.+4.*sin(p.z*3.-time*.44+sin(p.y*3.))+2.4*sin(p.y*5.+time*.34));
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy*2.-resolution)/resolution.y;
      uv.y-=verticalOffset;
      vec3 origin=vec3(0.,0.,3.7), ray=normalize(vec3(uv,-cameraZoom));
      float travel=0.; vec3 p=origin; float distanceToSurface=1.;
      // Estimate subpixel silhouette coverage from the nearest ray approach.
      // MSAA on the full-screen quad cannot smooth a ray-marched boundary.
      float nearest=1000.; vec3 edgePoint=origin;
      for(int i=0;i<64;i++){
        p=origin+ray*travel; distanceToSurface=shape(p);
        float footprint=max(.0001,2.*travel/(cameraZoom*resolution.y));
        float proximity=distanceToSurface/footprint;
        if(proximity<nearest){nearest=proximity;edgePoint=p;}
        if(distanceToSurface<.0015||travel>6.)break;
        travel+=distanceToSurface*.8;
      }
      float coverage=1.-smoothstep(.25,1.25,nearest);
      if(coverage<=0.){gl_FragColor=vec4(0.);return;}
      p=edgePoint;
      vec2 e=vec2(.002,0.);
      vec3 n=normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));
      vec3 q=local(p);
      float flow=current(q);
      float inner=current(q*.78+refract(ray,n,.72)*.6+vec3(0.,time*.025,0.));
      float ribbon=smoothstep(.15,.95,flow);
      float veins=pow(.5+.5*inner,6.);
      vec3 blue=vec3(.025,.19,.68), cyan=vec3(.015,.75,.9), violet=vec3(.45,.12,.75);
      float colourPhase=q.y*2.1+q.x*1.4+inner*.65+sin(q.z*2.-time*.18);
      float purpleWave=smoothstep(-.8,.8,sin(colourPhase-time*.28));
      float roseWave=pow(.5+.5*sin(colourPhase*1.3+time*.21+1.4),5.);
      vec3 pigment=mix(mix(blue,cyan,ribbon*.68),vec3(.48,.16,.82),purpleWave*.72);
      pigment=mix(pigment,vec3(.85,.3,.57),roseWave*.22);
      float diffuse=.3+.7*max(dot(n,normalize(vec3(-.6,.9,1.2))),0.);
      float fresnel=pow(1.-max(dot(n,-ray),0.),2.4);
      float specular=pow(max(dot(reflect(ray,n),normalize(vec3(-.6,.8,1.))),0.),65.);
      vec3 bg=mix(vec3(.051,.055,.047),vec3(.98,.98,.965),lightTheme);
      vec3 color=mix(bg,pigment*diffuse,.63+.24*ribbon)+veins*vec3(.09,.25,.28);
      color=mix(color,mix(vec3(.2,.82,1.),vec3(.06,.28,.54),lightTheme),fresnel*.8);
      color+=specular*vec3(.8,.9,1.);
      gl_FragColor=vec4(color,coverage);
    }`
