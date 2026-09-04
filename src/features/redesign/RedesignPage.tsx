'use client'

import { useEffect } from 'react'

import { CasesSection } from './components/CasesSection'
import { CapabilityAccordion } from './components/CapabilityAccordion'
import { ArticlesSection } from './components/ArticlesSection'
import { Hero } from './components/Hero'
import { ResearchBanner } from './components/ResearchBanner'
import { ContactSection, Footer, ManifestoSection } from './components/Sections'
import { SiteHeader } from './components/SiteHeader'
import { usePortfolioTheme } from './hooks/usePortfolioTheme'
import './redesign.css'

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
      { threshold: 0.15 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

export function RedesignPage() {
  const [isDark, toggleTheme] = usePortfolioTheme()
  useRevealOnScroll()

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} />
      <main id="main-content">
        <Hero isDark={isDark} />
        <CapabilityAccordion />
        <ManifestoSection />
        <div className="rd-section rd-section--banner">
          <ResearchBanner />
        </div>
        <CasesSection />
        <ArticlesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
