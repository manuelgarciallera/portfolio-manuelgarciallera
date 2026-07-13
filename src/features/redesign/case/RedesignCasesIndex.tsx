'use client'

import { useEffect, useState } from 'react'

import { CasesSection } from '../components/CasesSection'
import { SiteHeader } from '../components/SiteHeader'
import '../redesign.css'

export function RedesignCasesIndex() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('rd-theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    window.localStorage.setItem('rd-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.rd-reveal').forEach((el) => el.classList.add('is-in'))
  }, [])

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={() => setIsDark((value) => !value)} forceVisible />
      <main className="rd-page-offset">
        <CasesSection />
      </main>
    </div>
  )
}
