'use client'

import { useEffect, useMemo, useState } from 'react'

import { SiteHeader } from '../components/SiteHeader'
import type { CaseStudy } from '../content/types'
import { AiProcessBlock, PhaseNav, PhaseSection, PrototypeToComponent } from './CaseBlocks'
import '../redesign.css'

function useRevealOnScroll(): void {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.rd-reveal'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

export function CasePage({ study }: { study: CaseStudy }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('rd-theme') === 'dark'
  })
  useRevealOnScroll()

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    window.localStorage.setItem('rd-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const meta = useMemo(
    () => [
      ['Contexto', study.context],
      ['Rol', study.role],
      ['Stack', study.stack.join(' · ')],
      ['Año', study.year],
    ],
    [study],
  )

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={() => setIsDark((value) => !value)} forceVisible />
      <main className="rd-case-page">
        <header className="rd-case-hero rd-section">
          <p className="rd-label rd-reveal" data-index={study.index}>
            Caso
          </p>
          <h1 className="rd-case-page-title rd-reveal">
            {study.title}
            {study.titleAccent ? <em>{study.titleAccent}</em> : null}
          </h1>
          <p className="rd-case-claim rd-reveal">{study.claim}</p>
          <dl className="rd-meta-grid rd-reveal">
            {meta.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </header>

        <PhaseNav phases={study.phases} />

        {study.phases.map((phase, i) =>
          phase.id === 'ia' ? (
            <section key={phase.id} className="rd-section rd-case-phase" id="fase-ia">
              <p className="rd-label rd-reveal" data-index={String(i + 1).padStart(2, '0')}>
                IA en el proceso
              </p>
              <div className="rd-prose">
                {phase.paragraphs.map((text) => (
                  <p key={text.slice(0, 32)} className="rd-reveal">
                    {text}
                  </p>
                ))}
              </div>
              <AiProcessBlock ai={study.ai} />
            </section>
          ) : (
            <PhaseSection key={phase.id} phase={phase} order={i + 1} />
          ),
        )}

        <PrototypeToComponent
          figmaLayers={study.figmaLayers}
          codeEvidence={study.codeEvidence}
          dataMapping={study.dataMapping}
        />

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="∞">
            Aprendizajes
          </p>
          <div className="rd-prose">
            {study.learnings.map((item) => (
              <p key={item.slice(0, 32)} className="rd-learning rd-reveal">
                {item}
              </p>
            ))}
            <p className="rd-future-question rd-reveal">
              Pregunta abierta: <em>{study.futureQuestion}</em>
            </p>
          </div>
        </section>

        <section className="rd-section rd-contact">
          <a className="rd-contact-mail rd-reveal" href="mailto:manuelgarciallera@outlook.com">
            Hablemos<em>.</em>
          </a>
        </section>
      </main>
    </div>
  )
}
