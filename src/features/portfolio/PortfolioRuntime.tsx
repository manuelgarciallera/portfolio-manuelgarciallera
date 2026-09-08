'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { ReactNode } from 'react'
import type { CaseCardItem } from '@/features/redesign/components/CaseCard'
import { RedesignPage } from '@/features/redesign/RedesignPage'

// Rediseño v2 (Claude, feature/claude-redesign). El diseño anterior
// permanece intacto en ./PortfolioPage y en la rama archive/hero-v1.
export function PortfolioRuntime({ visualGallery, cases }: { visualGallery?: ReactNode; cases: CaseCardItem[] }) {
  return (
    <ErrorBoundary>
      <RedesignPage visualGallery={visualGallery} cases={cases} />
    </ErrorBoundary>
  )
}
