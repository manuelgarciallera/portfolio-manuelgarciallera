'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CaseCard, type CaseCardItem } from '../components/CaseCard'
import { selectCenteredPreview } from '../components/projectPreviewPlayback'

export function NextCase({ item }: { item: CaseCardItem }) {
  const visualRef = useRef<HTMLDivElement | null>(null)
  const [activePreview, setActivePreview] = useState<string | null>(null)
  const registerPreview = useCallback((_slug: string, element: HTMLDivElement | null) => {
    visualRef.current = element
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const visual = visualRef.current
      const bounds = visual?.getBoundingClientRect()
      setActivePreview(bounds ? selectCenteredPreview([
        { id: item.slug, top: bounds.top, bottom: bounds.bottom },
      ], window.innerHeight) : null)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [item.slug])

  const isActive = activePreview === item.slug
  return <aside data-motion={isActive ? 'active' : 'paused'} className="rd-next-case">
    <p className="rd-next-case__label">Siguiente caso de estudio</p>
    <CaseCard item={item} viewportActive={isActive} registerPreview={registerPreview} />
  </aside>
}
