'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { SiteHeader } from '../components/SiteHeader'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Footer } from '../components/Sections'
import { usePortfolioTheme } from '../hooks/usePortfolioTheme'
import {
  PROCESS_AI_LAYER,
  PROCESS_INTRO,
  PROCESS_PHASES,
  PROCESS_PRINCIPLES,
  PROCESS_STATEMENT,
} from '../content/process'
import '../redesign.css'
import './process.css'

export function ProcessPage() {
  const [isDark, toggleTheme] = usePortfolioTheme()

  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>('.rd-reveal')
      .forEach((el) => el.classList.add('is-in'))
  }, [])

  return (
    <div className="rd-root">
      <SiteHeader
        isDark={isDark}
        onToggleTheme={toggleTheme}
        forceVisible
      />

      <main className="rd-page-offset" id="main-content">
        <section className="rd-section">
          <Breadcrumbs items={[{ label: 'Proceso' }]} />
          <p className="rd-label rd-reveal" data-index="00">
            Proceso
          </p>
          <h1 className="rd-case-page-title rd-reveal">
            Cómo trabajo, paso a paso.
          </h1>
          <p className="rd-statement rd-reveal">{PROCESS_STATEMENT}</p>
          <div className="rd-prose rd-reveal">
            {PROCESS_INTRO.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="01">
            Las seis fases
          </p>
          <div className="rd-axes">
            {PROCESS_PHASES.map((phase) => (
              <article key={phase.index} className="rd-axis rd-reveal">
                <div className="rd-process-image">
                  {/* Landscape sources need ~1.85× the frame width when cropped to 25:26. */}
                  <Image src={phase.image} alt="" fill loading="lazy" sizes="(max-width: 1179px) 170vw, 56vw" />
                </div>
                <p className="rd-case-index">{phase.index}</p>
                <h2 className="rd-case-title">{phase.title}</h2>
                <p className="rd-case-claim">{phase.intent}</p>
                <dl className="rd-ai-grid">
                  <div className="rd-ai-row">
                    <dt>Decide la persona</dt>
                    <dd>{phase.decides}</dd>
                  </div>
                  <div className="rd-ai-row">
                    <dt>Ejecuta la IA</dt>
                    <dd>{phase.executes}</dd>
                  </div>
                  <div className="rd-ai-row">
                    <dt>Evidencia</dt>
                    <dd>{phase.evidence}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="02">
            La capa de IA
          </p>
          <h2 className="rd-statement rd-reveal">
            La frontera entre criterio y ejecución, escrita.
          </h2>
          <div className="rd-axes">
            {PROCESS_AI_LAYER.map((item) => (
              <article key={item.title} className="rd-axis rd-reveal">
                <h3 className="rd-case-title">{item.title}</h3>
                <p className="rd-case-claim">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="03">
            Principios
          </p>
          <div className="rd-axes">
            {PROCESS_PRINCIPLES.map((item) => (
              <article key={item.title} className="rd-axis rd-reveal">
                <h3 className="rd-case-title">{item.title}</h3>
                <p className="rd-case-claim">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="04">
            Verlo aplicado
          </p>
          <p className="rd-future-question rd-reveal">
            Cada caso publicado muestra este procedimiento sobre un proyecto real,
            con sus artefactos y su deuda declarada.
          </p>
          <p className="rd-prose rd-reveal">
            <Link className="rd-contact-mail" href="/casos">
              Ver los casos
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
