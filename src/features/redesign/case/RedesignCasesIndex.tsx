'use client'

import { useEffect } from 'react'

import { CasesSection } from '../components/CasesSection'
import type { CaseCardItem } from '../components/CaseCard'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { SiteHeader } from '../components/SiteHeader'
import { Footer } from '../components/Sections'
import { usePortfolioTheme } from '../hooks/usePortfolioTheme'
import '../redesign.css'

export function RedesignCasesIndex({ cases }: { cases: CaseCardItem[] }) {
  const [isDark, toggleTheme] = usePortfolioTheme()

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.rd-reveal').forEach((el) => el.classList.add('is-in'))
  }, [])

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} forceVisible />
      <main className="rd-page-offset" id="main-content">
        <section className="rd-section rd-cases-intro">
          <Breadcrumbs items={[{ label: 'Proyectos' }]} />
          <p className="rd-label rd-reveal" data-index="00">Trabajo seleccionado</p>
          <h1 className="rd-reveal">El trabajo se entiende mejor cuando se ve cómo fue pensado.</h1>
          <p className="rd-reveal">Aquí reúno proyectos distintos —académicos, propios y en evolución— y explico mi contribución, las decisiones difíciles, la evidencia disponible y lo que todavía queda abierto.</p>
        </section>
        <CasesSection items={cases} />
      </main>
      <Footer />
    </div>
  )
}
