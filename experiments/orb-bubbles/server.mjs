// Loopback-only visual lab. Proxies an existing local production build read-only.
import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
const files=new Map(['overlay.mjs','bubbles.mjs'].map(name=>[`/__orb-lab/${name}`,new URL(name,import.meta.url)]))
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  const url=new URL(req.url,'http://127.0.0.1:3031')
  if(files.has(url.pathname)){
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'})
   res.end(await readFile(files.get(url.pathname)));return
  }
  if(url.pathname!=='/'&&!/^\/(?:_next\/|art\/|fonts\/|favicon)/.test(url.pathname)){res.writeHead(404);res.end();return}
  const upstream=await fetch(`http://127.0.0.1:3020${url.pathname}${url.search}`,{headers:{'accept-encoding':'identity'}})
  let body=Buffer.from(await upstream.arrayBuffer())
  const headers={'Content-Type':upstream.headers.get('content-type')||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}
  if(url.pathname==='/')body=Buffer.from(body.toString().replace('</body>','<script type="module" src="/__orb-lab/overlay.mjs"></script></body>'))
  res.writeHead(upstream.status,headers);res.end(req.method==='HEAD'?undefined:body)
 }catch{res.writeHead(502);res.end('Abre primero el build local del portfolio en 3020.')} 
}).listen(3031,'127.0.0.1',()=>console.log('Orange bubbles lab: http://127.0.0.1:3031 (no public deployment)'))
