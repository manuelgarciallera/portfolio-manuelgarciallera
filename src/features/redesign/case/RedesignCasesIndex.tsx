'use client'

import { useEffect } from 'react'

import { CasesSection } from '../components/CasesSection'
import type { CaseCardItem } from '../components/CaseCard'
import { PageIntro } from '../components/PageIntro'
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
        <section className="rd-section rd-projects-intro">
          <PageIntro
            label="Proyectos"
            title="El trabajo se entiende mejor cuando se ve cómo fue pensado."
            lead="Aquí reúno proyectos distintos —académicos, propios y en evolución— y explico mi contribución, las decisiones difíciles, la evidencia disponible y lo que todavía queda abierto."
            variant="projects"
          />
        </section>
        <CasesSection items={cases} showIntro={false} />
      </main>
      <Footer />
    </div>
  )
}
