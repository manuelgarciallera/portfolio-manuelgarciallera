'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { getPublishedCases } from '../content/cases'
import { CaseCard } from './CaseCard'
import { selectCenteredPreview } from './projectPreviewPlayback'

export function CasesSection() {
  const previewElements = useRef(new Map<string, HTMLDivElement>())
  const [activePreview, setActivePreview] = useState<string | null>(null)

  const registerPreview = useCallback((slug: string, element: HTMLDivElement | null) => {
    if (element) previewElements.current.set(slug, element)
    else previewElements.current.delete(slug)
  }, [])

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const regions = [...previewElements.current].map(([id, element]) => {
        const rect = element.getBoundingClientRect()
        return { id, top: rect.top, bottom: rect.bottom }
      })
      setActivePreview(selectCenteredPreview(regions, window.innerHeight))
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [])

  return (
    <section className="rd-section" id="casos">
      <p className="rd-label rd-reveal">
        Casos seleccionados
      </p>
      <div className="rd-cases-intro rd-reveal">
        <h2>Del problema al producto, sin perder el hilo.</h2>
        <div>
          <p>
            Cada caso muestra qué había que entender, qué decisiones tomé y cómo llegaron a un sistema que puede probarse.
          </p>
          <Link href="/casos">Ver todos los proyectos <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="rd-cases">
        {getPublishedCases().map((item) => (
          <CaseCard
            key={item.slug}
            item={item}
            viewportActive={activePreview === item.slug}
            registerPreview={registerPreview}
          />
        ))}
      </div>
    </section>
  )
}
