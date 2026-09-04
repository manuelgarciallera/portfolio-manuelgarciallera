'use client'

import Image from 'next/image'
import type { CaseStudy } from '../content/types'
import { CoordinationDiagram } from '../components/CoordinationDiagram'
import { useViewportActivity } from '../hooks/useViewportActivity'

export function CaseVisualJourney({ study }: { study: CaseStudy }) {
  const [sectionRef, isActive] = useViewportActivity<HTMLElement>()
  if (study.story || !study.visual?.slides.length) return null
  const slides = study.visual.slides
  return <section ref={sectionRef} data-motion={isActive ? 'active' : 'paused'} className={`rd-visual-journey rd-visual-journey--${study.visual.theme}`} aria-label={`Recorrido visual de ${study.title}${study.titleAccent ?? ''}`}>
    <header><p>El proyecto, por capas</p><h2>Pequeñas decisiones construyen el sistema.</h2></header>
    <div className="rd-visual-journey__rail" aria-hidden="true">{[...slides,...slides].map((slide,index)=><span key={`a-${index}`}>{slide.label}</span>)}</div>
    {slides.map((slide,index) => {
      const isPortrait = slide.src.includes('/mobile-')
      const isDeviceMockup = study.slug === 'the-ux-union' && isPortrait
      const mediaClassName = [
        isPortrait && 'rd-visual-journey__media--portrait',
        isDeviceMockup && 'rd-visual-journey__media--device',
      ].filter(Boolean).join(' ') || undefined

      return <figure key={slide.src} className={index%2 ? 'is-offset' : undefined}>
        <div className={mediaClassName}>{slide.kind === 'coordination-diagram' ? <CoordinationDiagram variant={slide.diagramVariant} /> : <Image src={slide.src} alt={slide.alt} width={isPortrait ? 1290 : 1920} height={isPortrait ? 2796 : 1080} sizes={isPortrait ? '(max-width:760px) 82vw, 30rem' : '(max-width:760px) 100vw, 84vw'} style={{objectFit:slide.fit ?? 'contain'}} />}</div>
        <figcaption><span>{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span><strong>{slide.label}</strong><p>{slide.description ?? (index === 0 ? study.claim : index === slides.length-1 ? `La evidencia conecta ${study.tags.toLowerCase()}.` : 'Una parte del sistema, aislada para entender su función.')}</p></figcaption>
      </figure>
    })}
    <div className="rd-visual-journey__rail is-reverse" aria-hidden="true">{[...slides,...slides].map((slide,index)=><span key={`b-${index}`}>{slide.label}</span>)}</div>
  </section>
}
