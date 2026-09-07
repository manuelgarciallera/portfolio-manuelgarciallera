import { randomUUID } from 'node:crypto'
// Explicitly start a fresh QA database on this loopback port first. Bootstrap
// must succeed before any fixture is written; existing owner databases abort.
// All scores below are synthetic fixtures, never measured production quality.
const base='http://127.0.0.1:3013'
const { OWNER_QA_EMAIL:email, OWNER_QA_PASSWORD:password, OWNER_QA_BOOTSTRAP:bootstrap }=process.env
if(!email?.endsWith('@example.invalid')||!password||!bootstrap) throw new Error('Isolated QA credentials required')
let token
async function post(path,body,extra={}) {
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`JWT ${token}`} : {}),...extra},body:JSON.stringify(body)})
  const result=await response.json()
  if(!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(result)}`)
  return result
}
await post('/api/users/first-register',{email,password},{'x-owner-bootstrap-secret':bootstrap})
token=(await post('/api/users/login',{email,password})).token
const brand=(await post('/api/brand-profiles',{name:'QA synthetic brand',slug:'qa-workflow-brand',_status:'published',colors:[
  {role:'background',value:'#000000'},{role:'surface',value:'#111111'},{role:'text',value:'#FFFFFF'},{role:'mutedText',value:'#AAAAAA'},
  {role:'accent',value:'#FF4B44'},{role:'interaction',value:'#00D4E6'},{role:'success',value:'#21A366'},{role:'danger',value:'#FF4B44'},
],usageWeights:[{role:'background',weight:70},{role:'surface',weight:20},{role:'text',weight:8},{role:'accent',weight:2}],motion:{duration:600,stagger:80,travel:24,easing:'ease-out',reducedMotion:'reduce'}})).doc
const page=(await post('/api/pages?draft=true',{title:'QA synthetic workflow page',slug:'qa-workflow-page',brandProfile:brand.id,layout:[{blockType:'hero',heading:'Workflow QA'}]})).doc
const preview=(await post('/api/owner/preview-snapshots',{pageId:page.id})).snapshot
const draft=(await post('/api/owner/draft-snapshots',{pageId:page.id})).snapshot
const release=(await post('/api/owner/releases',{confirmation:'REGISTRAR VERSIÓN',name:'QA synthetic release',changeSummary:'Synthetic fixtures: scores are NOT measured quality',gitCommit:randomUUID().replaceAll('-','').padEnd(40,'a'),previewSnapshot:preview.id,draftSnapshot:draft.id,quality:[{viewport:'desktop',performance:80,usability:80,accessibility:80,source:'manual',measuredAt:new Date().toISOString()}]})).release
const bundle=(await post('/api/owner/publication-bundles',{confirmation:'PREPARAR PUBLICACIÓN',name:'QA synthetic bundle',releaseIds:[release.id]})).bundle
const plan=(await post(`/api/owner/releases/${release.id}/restore-plans`,{confirmation:'PREPARAR RESTAURACIÓN'})).plan
console.log(JSON.stringify({bundleId:bundle.id,planId:plan.id,pageId:page.id,releaseId:release.id}))
