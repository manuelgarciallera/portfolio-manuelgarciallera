'use client'

import { ReactNode } from 'react'

import { Footer } from './Sections'
import { SiteHeader } from './SiteHeader'
import { usePortfolioTheme } from '../hooks/usePortfolioTheme'

export function EditorialShell({ children }: { children: ReactNode }) {
  const [isDark, toggleTheme] = usePortfolioTheme()

  return (
    <div className="rd-root">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} forceVisible />
      {children}
      <Footer />
    </div>
  )
}
