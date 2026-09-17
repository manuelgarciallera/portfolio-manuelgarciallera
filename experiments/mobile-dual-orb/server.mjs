// Disposable visual experiment; loopback only, no authenticated/API proxying.
import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
const shader=await readFile(new URL('../../src/features/redesign/components/organic-orb-shaders.ts',import.meta.url),'utf8')
const vertex=shader.match(/ORB_VERTEX = `([\s\S]*?)`/)[1]
const fragment=shader.match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]
 .replace('vec3(.025,.19,.68), cyan=vec3(.015,.75,.9), violet=vec3(.45,.12,.75)','vec3(.8,.12,.015), cyan=vec3(1.,.68,.025), violet=vec3(.95,.25,.01)')
 .replace('vec3(.48,.16,.82)','vec3(.95,.3,.015)').replace('vec3(.85,.3,.57)','vec3(1.,.79,.08)')
 .replace('vec3(.09,.25,.28)','vec3(.28,.19,.035)').replace('vec3(.2,.82,1.),vec3(.06,.28,.54)','vec3(1.,.72,.18),vec3(.58,.22,.015)')
 .replace('vec3(.8,.9,1.)','vec3(1.,.93,.64)')
createServer(async(req,res)=>{
 try {
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  const u=new URL(req.url,'http://127.0.0.1:3032')
  const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}
  if(u.pathname==='/__dual/shader.json'){res.writeHead(200,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({vertex,fragment}));return}
  if(u.pathname==='/__dual/scene.mjs'){res.writeHead(200,{...headers,'Content-Type':'text/javascript'});res.end(await readFile(new URL('scene.mjs',import.meta.url)));return}
  if(u.pathname!=='/'&&!/^\/(?:_next\/|art\/|fonts\/|favicon)/.test(u.pathname)){res.writeHead(404);res.end();return}
  const upstream=await fetch(`http://127.0.0.1:3020${u.pathname}${u.search}`,{headers:{'accept-encoding':'identity'}})
  let body=Buffer.from(await upstream.arrayBuffer())
  if(u.pathname==='/')body=Buffer.from(body.toString().replace('</body>','<script type="module" src="/__dual/scene.mjs"></script></body>'))
  res.writeHead(upstream.status,{...headers,'Content-Type':upstream.headers.get('content-type')||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body)
 }catch{res.writeHead(502);res.end('Inicia el build local en 3020.')}
}).listen(3032,'127.0.0.1',()=>console.log('Dual-orb mobile prototype: http://127.0.0.1:3032'))
