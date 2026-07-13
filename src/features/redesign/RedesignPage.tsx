'use client'

import { useEffect, useMemo, useState } from 'react'

import { CasesSection } from './components/CasesSection'
import { Hero } from './components/Hero'
import { CapabilitiesSection, ContactSection, Footer, ManifestoSection } from './components/Sections'
import { SiteHeader } from './components/SiteHeader'
import './redesign.css'

function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
}

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
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('rd-theme') === 'dark'
  })
  const reduceMotion = usePrefersReducedMotion()
  useRevealOnScroll()

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    window.localStorage.setItem('rd-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={() => setIsDark((value) => !value)} />
      <main>
        <Hero isDark={isDark} reduceMotion={reduceMotion} />
        <ManifestoSection />
        <CapabilitiesSection />
        <CasesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
