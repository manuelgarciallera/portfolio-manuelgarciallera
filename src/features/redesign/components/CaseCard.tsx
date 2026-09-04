'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type PointerEvent, type RefCallback, useCallback, useEffect, useRef, useState } from 'react'

import type { CaseStudy } from '../content/types'
import { BuySellEditorialCover } from './BuySellEditorialCover'
import { ProjectEditorialCover } from './ProjectEditorialCover'
import { ProjectPreviewCarousel } from './ProjectPreviewCarousel'
import { TechStack } from './TechStack'

export type CaseCardItem = Pick<
  CaseStudy,
  'slug' | 'index' | 'title' | 'titleAccent' | 'claim' | 'role' | 'stack' | 'tags' | 'year' | 'published' | 'visual' | 'status' | 'contribution'
>

export interface CaseCardProps {
  item: CaseCardItem
  viewportActive?: boolean
  registerPreview?: (slug: string, element: HTMLDivElement | null) => void
}

export function CaseCard({ item, viewportActive = false, registerPreview }: CaseCardProps) {
  const href = item.published ? `/casos/${item.slug}` : '/casos'
  const visualRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [pointerEngaged, setPointerEngaged] = useState(false)
  const [titleVisible, setTitleVisible] = useState(false)
  const engaged = viewportActive || pointerEngaged

  useEffect(() => {
    const title = titleRef.current
    if (!title || typeof IntersectionObserver === 'undefined') {
      const fallbackFrame = requestAnimationFrame(() => setTitleVisible(true))
      return () => cancelAnimationFrame(fallbackFrame)
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      setTitleVisible(entry.isIntersecting)
    }, { threshold: 0.01 })

    observer.observe(title)
    return () => observer.disconnect()
  }, [])

  const assignVisualRef: RefCallback<HTMLDivElement> = useCallback((element) => {
    visualRef.current = element
    registerPreview?.(item.slug, element)
  }, [item.slug, registerPreview])

  const movePointerCta = (event: PointerEvent<HTMLDivElement>) => {
    const visual = visualRef.current
    if (!visual || event.pointerType === 'touch') return
    const rect = visual.getBoundingClientRect()
    visual.style.setProperty('--case-pointer-x', `${event.clientX - rect.left}px`)
    visual.style.setProperty('--case-pointer-y', `${event.clientY - rect.top}px`)
  }

  const resetVisual = () => {
    setPointerEngaged(false)
    visualRef.current?.style.setProperty('--case-pointer-x', '50%')
    visualRef.current?.style.setProperty('--case-pointer-y', '50%')
  }

  return (
    <article
      className={`rd-case${item.published ? '' : ' rd-case--draft'}`}
    >
      <header className="rd-case-caption">
        <span className="rd-case-heading">
          {item.status === 'evolving' ? <span className="rd-case-status">Caso en evolución</span> : null}
          {item.status === 'experimental' ? <span className="rd-case-status">Experimental</span> : null}
          <h3 ref={titleRef} className={`rd-case-title${titleVisible ? ' is-in' : ''}`}><Link className="rd-case-title-reveal" href={href} aria-label={`Caso ${item.title}${item.titleAccent ?? ''}`}>{item.title}{item.titleAccent ? <em>{item.titleAccent}</em> : null}</Link></h3>
          {item.contribution ? <span className="rd-case-contribution">{item.contribution}</span> : null}
        </span>
      </header>
      {item.visual ? (
        <div
          ref={assignVisualRef}
          className={`rd-case-visual rd-case-visual--${item.visual.theme}`}
          data-case-preview={item.slug}
          data-engaged={engaged ? 'true' : 'false'}
          data-viewport-active={viewportActive ? 'true' : 'false'}
          onPointerEnter={(event) => { if (event.pointerType !== 'touch') setPointerEngaged(true) }}
          onPointerMove={movePointerCta}
          onPointerLeave={resetVisual}
          onFocusCapture={() => setPointerEngaged(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) resetVisual()
          }}
        >
          <Link className="rd-case-hit-area" href={href} aria-label={`Ver caso de estudio: ${item.title}${item.titleAccent ?? ''}`}>
            <span className="rd-sr-only">Ver caso de estudio</span>
          </Link>
          <span className="rd-case-hover-cta" data-pointer-cta="true" aria-hidden="true">Ver caso de estudio</span>
          <span className="rd-case-visual-copy">
            <Image className="rd-case-logo" src={item.visual.logoSrc} alt={item.visual.logoAlt} width={190} height={54} />
            <span className="rd-case-visual-narrative">
              <span className="rd-case-visual-headline">
                <span className="rd-case-visual-kicker">{item.visual.kicker}</span>
                <strong>{item.visual.statement}</strong>
              </span>
              <span className="rd-case-visual-details">
                <span>{item.claim}</span>
                <span>{item.role}</span>
              </span>
              <TechStack technologies={item.stack} />
            </span>
          </span>
          <ProjectPreviewCarousel
            label={`Vista previa de ${item.title}${item.titleAccent ?? ''}`}
            slides={item.visual.slides}
            engaged={engaged}
            cover={item.visual.theme === 'buy-sell'
              ? <BuySellEditorialCover />
              : <ProjectEditorialCover index={item.index} visual={item.visual} />}
          />
        </div>
      ) : null}
    </article>
  )
}
