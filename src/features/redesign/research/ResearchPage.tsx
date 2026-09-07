'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { SiteHeader } from '../components/SiteHeader'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Footer } from '../components/Sections'
import { usePortfolioTheme } from '../hooks/usePortfolioTheme'
import {
  RESEARCH_CLOSING,
  RESEARCH_FRAMEWORK,
  RESEARCH_INTRO,
  RESEARCH_LINES,
  RESEARCH_METHOD,
  RESEARCH_QUESTION,
  RESEARCH_ROOT,
  RESEARCH_ROOT_OBJECTS,
  RESEARCH_STATEMENT,
} from '../content/research'
import { PROFILE_LINKS } from '@/lib/site-config'
import '../redesign.css'

export function ResearchPage() {
  const [isDark, toggleTheme] = usePortfolioTheme()

  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>('.rd-reveal')
      .forEach((el) => el.classList.add('is-in'))
  }, [])

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} forceVisible />

      <main className="rd-page-offset" id="main-content">
        <section className="rd-section">
          <Breadcrumbs items={[{ label: 'Investigación' }]} />
          <p className="rd-label rd-reveal" data-index="00">
            Investigación
          </p>
          <h1 className="rd-case-page-title rd-reveal">
            Del objeto a la interfaz
          </h1>
          <p className="rd-statement rd-reveal">{RESEARCH_STATEMENT}</p>
          <div className="rd-prose rd-reveal">
            {RESEARCH_INTRO.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="01">
            La pregunta
          </p>
          <p className="rd-future-question rd-reveal">{RESEARCH_QUESTION}</p>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="02">
            La raíz · RDA y RFA, 1949–1989
          </p>
          <div className="rd-prose rd-reveal">
            {RESEARCH_ROOT.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <dl className="rd-meta-grid rd-reveal">
            {RESEARCH_ROOT_OBJECTS.map((object) => (
              <div key={object.name}>
                <dt>{object.name}</dt>
                <dd>{object.note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="03">
            Líneas abiertas
          </p>
          <div className="rd-axes">
            {RESEARCH_LINES.map((line) => (
              <article key={line.index} className="rd-axis rd-reveal">
                <p className="rd-case-index">{line.index}</p>
                <h2 className="rd-case-title">{line.title}</h2>
                <p className="rd-case-tags">{line.status}</p>
                <p className="rd-case-claim">{line.body}</p>
              </article>
            ))}
          </div>
          <p className="rd-learning rd-reveal">{RESEARCH_CLOSING}</p>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="04">
            Cómo trabajo
          </p>
          <div className="rd-prose rd-reveal">
            {RESEARCH_METHOD.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <ul className="rd-layer-list rd-reveal">
            {RESEARCH_FRAMEWORK.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </section>

        <section className="rd-section">
          <p className="rd-label rd-reveal" data-index="05">
            Seguir
          </p>
          <p className="rd-prose rd-reveal">
            Los textos en curso están en{' '}
            <Link className="rd-contact-mail" href="/articulos">
              el cuaderno
            </Link>
            , y los casos donde esto se convierte en producto, en{' '}
            <Link className="rd-contact-mail" href="/casos">
              los proyectos
            </Link>
            .
          </p>
          {PROFILE_LINKS.orcid ? (
            <p className="rd-prose rd-reveal">
              <a className="rd-contact-mail" href={PROFILE_LINKS.orcid} rel="me noopener noreferrer" target="_blank">
                ORCID <span aria-hidden="true">↗</span>
              </a>
            </p>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}
