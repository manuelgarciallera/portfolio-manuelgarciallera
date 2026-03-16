export const HERO_VERTEX_SHADER = `uniform float uTime;varying vec3 vN;varying vec3 vP;varying float vNoise;
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tiSq(vec4 r){return 1.79284291-.85373472*r;}
float sn(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=tiSq(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 mv=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);mv=mv*mv;
return 42.*dot(mv*mv,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
void main(){vN=normalize(normalMatrix*normal);vP=position;float n=sn(position*1.2+uTime*.18);vNoise=n;
gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*n*.42,1.);}`;

export const HERO_FRAGMENT_SHADER = `uniform float uTime;varying vec3 vN;varying vec3 vP;varying float vNoise;
void main(){float fr=pow(1.-max(dot(vN,vec3(0.,0.,1.)),0.),2.);
vec3 b=vec3(.008,.065,.1);vec3 t=vec3(.14,.54,.58);vec3 hi=vec3(.85,.97,.99);
float tv=vP.y*.5+.5;vec3 col=mix(b,t,tv*.72);
float ir=sin(vP.y*4.+vP.x*2.+uTime*.4)*.5+.5;col=mix(col,vec3(.18,.08,.32),ir*.15*(1.-tv));
col+=fr*hi*.55+fr*fr*vec3(.38,.72,.84)*.22+vNoise*.04*t;
gl_FragColor=vec4(clamp(col,0.,1.),.88+fr*.05);}`;
