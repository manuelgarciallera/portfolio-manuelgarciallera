'use client'

import { useViewportActivity } from '../hooks/useViewportActivity'
import { CaseCard, type CaseCardItem } from '../components/CaseCard'

export function NextCase({ item }: { item: CaseCardItem }) {
  const [sectionRef, isActive] = useViewportActivity<HTMLElement>()
  return <aside ref={sectionRef} data-motion={isActive ? 'active' : 'paused'} className="rd-next-case">
    <p className="rd-next-case__label">Siguiente caso de estudio</p>
    <CaseCard item={item} viewportActive={isActive} />
  </aside>
}
