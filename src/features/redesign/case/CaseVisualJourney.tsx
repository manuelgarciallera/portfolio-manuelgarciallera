'use client'

import { ProjectEvidenceImage } from './ProjectEvidenceImage'
import { isPortraitEvidence, projectImageDimensions } from './projectImageDimensions'
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
      const isPortrait = isPortraitEvidence(slide.src)
      const dimensions = projectImageDimensions[slide.src]
      const isLandscape = Boolean(dimensions && dimensions[0] / dimensions[1] >= 1.1)
      const isDeviceMockup = study.slug === 'the-ux-union' && isPortrait
      const mediaClassName = [
        'rd-visual-journey__media',
        slide.kind === 'coordination-diagram' && 'rd-visual-journey__media--diagram',
        isPortrait && 'rd-visual-journey__media--portrait',
        isDeviceMockup && 'rd-visual-journey__media--device',
      ].filter(Boolean).join(' ') || undefined

      return <figure key={slide.src} className={`rd-visual-journey__slide${index%2 ? ' is-offset' : ''}${isLandscape ? ' rd-visual-journey__slide--landscape' : ''}`}>
        <div className={mediaClassName}>{slide.kind === 'coordination-diagram' ? <CoordinationDiagram variant={slide.diagramVariant} /> : <ProjectEvidenceImage src={slide.src} alt={slide.alt} sizes={isLandscape ? '92vw' : '(max-width:1023px) 92vw, 58vw'} />}</div>
        <figcaption className="rd-visual-journey__caption"><span>{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span><strong>{slide.label}</strong><p>{slide.description ?? (index === 0 ? study.claim : index === slides.length-1 ? `La evidencia conecta ${study.tags.toLowerCase()}.` : 'Una parte del sistema, aislada para entender su función.')}</p></figcaption>
      </figure>
    })}
    <div className="rd-visual-journey__rail is-reverse" aria-hidden="true">{[...slides,...slides].map((slide,index)=><span key={`b-${index}`}>{slide.label}</span>)}</div>
  </section>
}
