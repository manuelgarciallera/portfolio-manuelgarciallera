'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RedesignPage } from '@/features/redesign/RedesignPage'

// Rediseño v2 (Claude, feature/claude-redesign). El diseño anterior
// permanece intacto en ./PortfolioPage y en la rama archive/hero-v1.
export function PortfolioRuntime() {
  return (
    <ErrorBoundary>
      <RedesignPage />
    </ErrorBoundary>
  )
}
