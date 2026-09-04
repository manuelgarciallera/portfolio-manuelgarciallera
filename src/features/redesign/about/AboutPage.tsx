'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { SiteHeader } from '../components/SiteHeader'
import { Breadcrumbs } from '../components/Breadcrumbs'
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

export function AboutPage() {
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
          <Breadcrumbs items={[{ label: 'Sobre mí' }]} />
          <p className="rd-label rd-reveal" data-index="00">
            Sobre mí
          </p>
          <h1 className="rd-case-page-title rd-reveal">
            Manuel García-Llera
          </h1>
          <p className="rd-statement rd-reveal">{ABOUT_STATEMENT}</p>
          <div className="rd-prose rd-reveal">
            {ABOUT_INTRO.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="01">
            Cinco capas, en orden
          </p>
          <div className="rd-axes">
            {ABOUT_LAYERS.map((layer) => (
              <article key={layer.index} className="rd-axis rd-reveal">
                <p className="rd-case-index">{layer.index}</p>
                <h2 className="rd-case-title">{layer.title}</h2>
                <p className="rd-case-tags">{layer.place}</p>
                <p className="rd-case-claim">{layer.contribution}</p>
              </article>
            ))}
          </div>
          <p className="rd-learning rd-reveal">{ABOUT_CLOSING}</p>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="02">
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
          <p className="rd-label rd-reveal" data-index="03">
            Seguir
          </p>
          <p className="rd-future-question rd-reveal">
            Si quieres saber cómo se convierte esta trayectoria en decisiones concretas,
            he documentado el método y también sus límites.
          </p>
          <p className="rd-prose rd-reveal">
            <Link className="rd-contact-mail" href="/proceso">
              Ver el proceso
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
