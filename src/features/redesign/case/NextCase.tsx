'use client'

import type { CaseStudy } from '../content/types'
import { getPublishedCases } from '../content/cases'
import { useViewportActivity } from '../hooks/useViewportActivity'
import { CaseCard } from '../components/CaseCard'

export function NextCase({ currentSlug }: { currentSlug: string }) {
  const [sectionRef, isActive] = useViewportActivity<HTMLElement>()
  const cases = getPublishedCases()
  const current = cases.findIndex(({ slug }) => slug === currentSlug)
  const next: CaseStudy = cases[(current + 1) % cases.length]
  return <aside ref={sectionRef} data-motion={isActive ? 'active' : 'paused'} className="rd-next-case">
    <p className="rd-next-case__label">Siguiente caso de estudio</p>
    <CaseCard item={next} viewportActive={isActive} />
  </aside>
}
