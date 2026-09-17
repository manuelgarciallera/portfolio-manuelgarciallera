'use client'

import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'

export function DualOrbLab(){
 const frame=useRef<HTMLIFrameElement>(null)
 const [notice,setNotice]=useState('Prueba móvil · la portada original no cambia')
 useEffect(()=>{
  const iframe=frame.current
  if(!iframe)return
  let disposed=false,observer:MutationObserver|undefined,cleanup:(()=>void)|undefined,generation=0
  const load=()=>{
   const current=++generation
   observer?.disconnect();cleanup?.();cleanup=undefined
   const doc=iframe.contentDocument
   if(!doc)return
   let mounting=false
   const attempt=()=>{
    if(mounting)return
    const hero=doc.querySelector<HTMLElement>('.rd-hero')
    if(!hero||!doc.querySelector('.rd-hero-art[data-ready="true"]'))return
    observer?.disconnect()
    mounting=true
    if(!iframe.contentWindow?.matchMedia('(max-width:767px)').matches){setNotice('Esta prueba es solo móvil. Reduce la ventana para verla.');return}
    if(iframe.contentWindow.matchMedia('(prefers-reduced-motion:reduce)').matches)return
    import('./warm-orb').then(({mountWarmOrb})=>{
     if(disposed||current!==generation)return
     cleanup=mountWarmOrb(hero)
    }).catch(()=>{if(!disposed)setNotice('No se pudo cargar el amarillo. Conservamos el azul.')})
   }
   observer=new MutationObserver(attempt);observer.observe(doc,{subtree:true,attributes:true,childList:true});attempt()
  }
  iframe.addEventListener('load',load)
  if(iframe.contentDocument?.readyState==='complete')load()
  return()=>{disposed=true;generation++;iframe.removeEventListener('load',load);observer?.disconnect();cleanup?.()}
 },[])
 return <main style={{position:'fixed',inset:0,background:'#0d0e0c'}}>
  <iframe ref={frame} title="Prueba de orbes" src="/" style={{width:'100%',height:'100%',border:0}}/>
  <Link href="/" style={{position:'fixed',top:4,left:4,zIndex:1000,font:'11px system-ui',padding:'6px 9px',borderRadius:12,color:'#fff',background:'#222'}} aria-label="Salir de la prueba y volver al portfolio original">{notice} · Salir</Link>
 </main>
}
