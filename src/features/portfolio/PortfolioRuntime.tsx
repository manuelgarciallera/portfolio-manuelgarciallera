'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import PortfolioPage from './PortfolioPage'

export function PortfolioRuntime() {
  return (
    <ErrorBoundary>
      <PortfolioPage />
    </ErrorBoundary>
  )
}

