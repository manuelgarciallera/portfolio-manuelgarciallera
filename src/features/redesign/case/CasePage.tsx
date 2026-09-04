'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'

import { SiteHeader } from '../components/SiteHeader'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ProjectPreviewCarousel } from '../components/ProjectPreviewCarousel'
import type { CaseStudy } from '../content/types'
import { AiProcessBlock, PhaseNav, PhaseSection, PrototypeToComponent } from './CaseBlocks'
import { CaseStory } from './CaseStory'
import { NextCase } from './NextCase'
import { CaseVisualJourney } from './CaseVisualJourney'
import { ContactSection, Footer } from '../components/Sections'
import { usePortfolioTheme } from '../hooks/usePortfolioTheme'
import { TheUxUnionFeatureBrand } from './TheUxUnionFeatureBrand'
import { TechStack } from '../components/TechStack'
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
  const [isDark, toggleTheme] = usePortfolioTheme()
  useRevealOnScroll()

  const meta = useMemo(
    () => [
      ['Contexto', study.context],
      ['Contribución', study.contribution ?? study.role],
      ['Stack', study.stack.join(' · ')],
      ['Año', study.year],
    ],
    [study],
  )
  const evidenceSlides = study.visual?.slides ?? []

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} forceVisible />
      <main className="rd-case-page" id="main-content">
        <header className="rd-case-hero rd-section">
          <Breadcrumbs items={[{ href: '/casos', label: 'Proyectos' }, { label: `${study.title}${study.titleAccent ?? ''}` }]} />
          <p className="rd-label rd-reveal" data-index={study.index}>
            Caso
          </p>
          <h1 className="rd-case-page-title rd-reveal">
            {study.title}
            {study.titleAccent ? <em>{study.titleAccent}</em> : null}
          </h1>
          <p className="rd-case-claim rd-reveal">{study.claim}</p>
          {study.status === 'evolving' ? <p className="rd-case-page-status rd-reveal">Caso en evolución</p> : null}
          {study.status === 'experimental' ? <p className="rd-case-page-status rd-reveal">Experimental</p> : null}
          {study.visual && !study.story ? (
            <div className={`rd-case-feature rd-case-feature--${study.visual.theme} rd-reveal`} aria-label={`Presentación visual de ${study.title}${study.titleAccent ?? ''}`}>
              <div className="rd-case-feature-copy">
                {study.visual.theme === 'theuxunion'
                  ? <TheUxUnionFeatureBrand />
                  : <Image src={study.visual.logoSrc} alt={study.visual.logoAlt} width={220} height={64} priority />}
                <p>{study.visual.statement}</p>
                <div className="rd-case-feature-actions">
                  <a href="#fase-prototipo">Explorar el sistema <span aria-hidden="true">↓</span></a>
                  <a href="#fase-desarrollo">Ver la implementación <span aria-hidden="true">↓</span></a>
                </div>
              </div>
              <ProjectPreviewCarousel
                label={`Presentación de ${study.title}${study.titleAccent ?? ''}`}
                slides={study.visual.slides}
                variant="feature"
                priority
              />
            </div>
          ) : null}
          <dl className="rd-meta-grid rd-reveal">
            {meta.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{term === 'Stack' ? <TechStack technologies={study.stack} compact /> : detail}</dd>
              </div>
            ))}
          </dl>
          {study.proofPoints?.length ? (
            <dl className="rd-proof-strip rd-reveal" aria-label="Señales principales del proyecto">
              {study.proofPoints.map((point) => (
                <div key={point.value}>
                  <dt>{point.value}</dt>
                  <dd>{point.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {study.collaboration ? <p className="rd-case-collaboration rd-reveal"><strong>Colaboración:</strong> {study.collaboration}</p> : null}
          {study.disclosure ? <p className="rd-case-disclosure rd-reveal">{study.disclosure}</p> : null}
        </header>

        <CaseStory study={study} />
        <CaseVisualJourney study={study} />

        <PhaseNav phases={study.phases} />

        {study.phases.map((phase, i) => {
          const phaseVisual = evidenceSlides.length ? evidenceSlides[i % evidenceSlides.length] : undefined

          return phase.id === 'ia' ? (
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
            <PhaseSection key={phase.id} phase={phase} order={i + 1} visual={phaseVisual} theme={study.visual?.theme} />
          )
        })}

        <PrototypeToComponent
          figmaLayers={study.figmaLayers}
          codeEvidence={study.codeEvidence}
          dataMapping={study.dataMapping}
        />

        {study.links?.length ? (
          <section className="rd-section rd-case-evidence" id="evidencias">
            <p className="rd-label rd-reveal" data-index="E">Evidencias</p>
            <h2 className="rd-reveal">El trabajo, abierto a revisión.</h2>
            <p className="rd-reveal">El prototipo es una pieza del proceso: documenta el sistema, las decisiones y los flujos que sostienen el producto.</p>
            {study.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}
          </section>
        ) : null}

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

        <NextCase currentSlug={study.slug} />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
