'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import type { CaseAiProcess, CaseCodeEvidence, CasePhase, CaseVisual, CaseVisualSlide } from '../content/types'
import { CoordinationDiagram } from '../components/CoordinationDiagram'

export function PhaseNav({ phases }: { phases: CasePhase[] }) {
  const [active, setActive] = useState<string>(phases[0]?.id ?? '')

  useEffect(() => {
    const sections = phases
      .map((phase) => document.getElementById(`fase-${phase.id}`))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id.replace('fase-', ''))
        })
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [phases])

  return (
    <nav className="rd-phase-nav" aria-label="Fases del caso">
      {phases.map((phase) => (
        <a key={phase.id} href={`#fase-${phase.id}`} className={active === phase.id ? 'is-active' : ''}>
          {phase.title}
        </a>
      ))}
    </nav>
  )
}

export function PhaseSection({
  phase,
  order,
  visual,
  theme = 'neutral',
}: {
  phase: CasePhase
  order: number
  visual?: CaseVisualSlide
  theme?: CaseVisual['theme']
}) {
  const hasVisual = Boolean(visual && (visual.kind === 'coordination-diagram' || visual.src.startsWith('/')))

  return (
    <section
      className={`rd-section rd-case-phase${hasVisual ? ' rd-case-phase--with-visual' : ''}${hasVisual && order % 2 === 0 ? ' is-reversed' : ''}`}
      id={`fase-${phase.id}`}
    >
      <p className="rd-label rd-reveal" data-index={String(order).padStart(2, '0')}>
        {phase.title}
      </p>
      <div className="rd-prose">
        {phase.paragraphs.map((text) => (
          <p key={text.slice(0, 32)} className="rd-reveal">
            {text}
          </p>
        ))}
        {phase.bullets ? (
          <p className="rd-prose-methods rd-reveal">
            Métodos: {phase.bullets.join(' · ')}.
          </p>
        ) : null}
      </div>
      {hasVisual && visual ? visual.kind === 'coordination-diagram' ? (
        <div className={`rd-case-phase__visual rd-case-phase__visual--${theme} rd-reveal`}>
          <div className={`rd-case-phase__frame rd-case-phase__frame--${theme}`}>
            <CoordinationDiagram variant={visual.diagramVariant} />
          </div>
          <p className="rd-case-phase__visual-label">{visual.label}</p>
        </div>
      ) : (
        <figure className={`rd-case-phase__visual rd-case-phase__visual--${theme} rd-reveal`}>
          <div className={`rd-case-phase__frame rd-case-phase__frame--${theme}`} data-fit={visual.fit ?? 'cover'}>
            <Image
              src={visual.src}
              alt={visual.alt}
              width={1600}
              height={1100}
              sizes="(max-width: 760px) calc(100vw - 2rem), 56vw"
              style={{ objectFit: visual.fit ?? 'cover' }}
            />
          </div>
          <figcaption>{visual.label}</figcaption>
        </figure>
      ) : null}
    </section>
  )
}

export function AiProcessBlock({ ai }: { ai: CaseAiProcess }) {
  const rows: Array<[string, string]> = [
    ['Herramienta', ai.tool],
    ['Fase', ai.phase],
    ['Input humano', ai.humanInput],
    ['Output', ai.output],
    ['Criterio de selección', ai.criteria],
    ['Límites detectados', ai.limits],
    ['Decisión final', ai.decision],
  ]
  return (
    <dl className="rd-ai-grid rd-reveal">
      {rows.map(([term, detail]) => (
        <div key={term} className="rd-ai-row">
          <dt>{term}</dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  )
}

export function PrototypeToComponent({
  figmaLayers,
  codeEvidence,
  dataMapping,
}: {
  figmaLayers: string[]
  codeEvidence?: CaseCodeEvidence
  dataMapping?: string
}) {
  return (
    <section className="rd-section" id="prototipo-componente">
      <p className="rd-label rd-reveal" data-index="→">
        Del prototipo al componente
      </p>
      <div className="rd-compare rd-reveal">
        <div className="rd-compare-col">
          <h3>Figma · sistema atomizado</h3>
          <ul className="rd-layer-list">
            {figmaLayers.map((layer) => (
              <li key={layer}>{layer}</li>
            ))}
          </ul>
        </div>
        {codeEvidence ? (
          <div className="rd-compare-col">
            <h3>Angular · componente real</h3>
            <pre className="rd-code" aria-label={codeEvidence.filename} tabIndex={0}>
              <code>{codeEvidence.code}</code>
            </pre>
            <p className="rd-code-file">{codeEvidence.filename}</p>
          </div>
        ) : null}
      </div>
      {codeEvidence ? <p className="rd-compare-caption rd-reveal">{codeEvidence.caption}</p> : null}
      {dataMapping ? <p className="rd-data-mapping rd-reveal" aria-label="Mapeo entre interfaz y datos" tabIndex={0}>{dataMapping}</p> : null}
    </section>
  )
}
