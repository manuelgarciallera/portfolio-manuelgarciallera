'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'

import { SiteHeader } from '../components/SiteHeader'
import { PageIntro } from '../components/PageIntro'
import { Footer } from '../components/Sections'
import { usePortfolioTheme } from '../hooks/usePortfolioTheme'
import {
  ABOUT_CLOSING,
  ABOUT_FACTS,
  ABOUT_INTRO,
  ABOUT_LAYERS,
  ABOUT_NOW,
  ABOUT_STATEMENT,
} from '../content/about'
import '../redesign.css'
import { PERSON_LEGAL_NAME } from '@/lib/site-config'

/**
 * `identity` llega como arbol de servidor desde la ruta: es marcado estatico y no
 * tiene por que viajar como JavaScript. Ver AboutIdentity.tsx.
 */
export function AboutPage({ identity }: { identity?: ReactNode }) {
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
          <PageIntro label="Sobre mí" title={PERSON_LEGAL_NAME} lead={ABOUT_STATEMENT}>
            {ABOUT_INTRO.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </PageIntro>
        </section>

        {identity}

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="02">
            Cinco capas, en orden
          </p>
          <div className="rd-axes">
            {ABOUT_LAYERS.map((layer) => (
              <article key={layer.index} className="rd-axis rd-reveal">
                <p className="rd-case-index">{layer.index}</p>
                <h2 className="rd-case-title">{layer.title}</h2>
                <p className="rd-case-tags rd-education-place">{layer.place}</p>
                <p className="rd-case-claim">{layer.contribution}</p>
              </article>
            ))}
          </div>
          <p className="rd-learning rd-reveal">{ABOUT_CLOSING}</p>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="03">
            Ahora
          </p>
          <div className="rd-prose rd-reveal">
            {ABOUT_NOW.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <dl className="rd-meta-grid rd-reveal">
            {ABOUT_FACTS.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="04">
            Seguir
          </p>
          <p className="rd-future-question rd-reveal">
            Si quieres saber cómo se convierte esta trayectoria en decisiones concretas,
            he documentado el método y también sus límites.
          </p>
          <p className="rd-page-action rd-reveal">
            <Link href="/proceso">
              Ver el proceso <span aria-hidden="true">→</span>
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
