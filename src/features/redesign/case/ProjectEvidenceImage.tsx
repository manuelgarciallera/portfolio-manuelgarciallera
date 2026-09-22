'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { isPortraitEvidence, projectImageDimensions } from './projectImageDimensions'
import './project-evidence.css'

export function ProjectEvidenceImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [expanded, setExpanded] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const backdropStart = useRef(false)
  const [width, height] = projectImageDimensions[src] ?? [1600, 1000]
  const portrait = isPortraitEvidence(src)

  useEffect(() => {
    if (!expanded) return
    const dialog = dialogRef.current
    const trigger = triggerRef.current
    if (!dialog) return
    const scroll = { x: window.scrollX, y: window.scrollY }
    const location = window.location.href
    const body = document.body
    const keys = ['position', 'top', 'left', 'width', 'overflow', 'paddingRight'] as const
    const previous = Object.fromEntries(keys.map(key => [key, body.style[key]]))
    const gap = window.innerWidth - document.documentElement.clientWidth
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0
    body.style.position = 'fixed'
    body.style.top = `${-scroll.y}px`
    body.style.left = `${-scroll.x}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${padding + gap}px`
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      keys.forEach(key => { body.style[key] = previous[key] })
      if (window.location.href === location) {
        window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' })
        if (trigger?.isConnected) trigger.focus({ preventScroll: true })
      }
    }
  }, [expanded])

  return <><button ref={triggerRef} type="button" className="rd-project-evidence" onClick={() => setExpanded(true)} aria-haspopup="dialog"
    aria-label={`Ampliar imagen: ${alt}`} data-portrait={portrait ? 'true' : 'false'}
    data-device={portrait && (src.includes('/nude-project/') || src.includes('/theuxunion/')) ? 'true' : undefined}
    style={{ '--evidence-ratio': width / height, '--evidence-source-width': `${width}px` } as CSSProperties}>
    <Image src={src} alt={alt} width={width} height={height} quality={92}
      sizes={portrait ? '(max-width: 760px) 82vw, 23rem' : sizes} />
    <span className="rd-project-evidence__hint">Ampliar imagen <span aria-hidden="true">⤢</span></span>
  </button>
  {expanded ? <dialog ref={dialogRef} className="rd-evidence-dialog" aria-label={`Imagen ampliada: ${alt}`}
    onCancel={event => { event.preventDefault(); setExpanded(false) }}
    onPointerDown={event => { backdropStart.current = event.target === event.currentTarget }}
    onClick={event => { if (backdropStart.current && event.target === event.currentTarget) setExpanded(false) }}>
    <div className="rd-evidence-dialog__panel">
      <div className="rd-evidence-dialog__toolbar">
        <a href={src} target="_blank" rel="noreferrer">Abrir original en alta resolución <span aria-hidden="true">↗</span></a>
        <button ref={closeRef} type="button" aria-label="Cerrar imagen ampliada" onClick={() => setExpanded(false)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="rd-evidence-dialog__image"><Image src={src} alt={alt} width={width} height={height} unoptimized /></div>
    </div>
  </dialog> : null}</>
}
