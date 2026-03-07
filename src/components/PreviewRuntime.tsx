'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import PortfolioPreview from '@/components/PortfolioPreview'

export function PreviewRuntime() {
  return (
    <ErrorBoundary>
      <PortfolioPreview />
    </ErrorBoundary>
  )
}
