'use client'

import Image from 'next/image'
import { type MutableRefObject, type ReactNode, useEffect, useRef, useState } from 'react'

import { useSwipe } from '../hooks/useSwipe'

import type { CaseVisualSlide } from '../content/types'
import { CoordinationDiagram } from './CoordinationDiagram'
import { advancePreviewFrame, centeredTabScrollLeft, frameDurationMs, type PreviewFrame } from './projectPreviewPlayback'

interface ProjectPreviewCarouselProps {
  label: string
  slides: CaseVisualSlide[]
  priority?: boolean
  variant?: 'card' | 'feature'
  engaged?: boolean
  cover?: ReactNode
  controlRef?: MutableRefObject<CarouselControl | null>
}

export interface CarouselControl {
  move: (direction: -1 | 1) => void
}

export function ProjectPreviewCarousel({ label, slides, priority = false, variant = 'card', engaged, cover, controlRef }: ProjectPreviewCarouselProps) {
  const [frame, setFrame] = useState<PreviewFrame>(() => cover ? { kind: 'cover' } : { kind: 'slide', index: 0 })
  const [paused, setPaused] = useState(false)
  const [userControlled, setUserControlled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const focusWithin = useRef(false)
  const manuallyPaused = useRef(false)
  const regionRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const playbackPaused = paused || reducedMotion || slides.length < 2 || (variant === 'card' && engaged !== true)
  const active = frame.kind === 'slide' ? frame.index : 0

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (variant !== 'card' || engaged !== false || !cover) return
    const reset = window.setTimeout(() => {
      setFrame({ kind: 'cover' })
      setUserControlled(false)
      manuallyPaused.current = false
      setPaused(false)
    }, 0)
    return () => window.clearTimeout(reset)
  }, [cover, engaged, variant])

  useEffect(() => {
    if (playbackPaused) return undefined

    const duration = variant === 'card' ? frameDurationMs(frame) : 6500
    const timer = window.setTimeout(() => {
      setFrame((current) => cover ? advancePreviewFrame(current, slides.length) : {
        kind: 'slide',
        index: current.kind === 'slide' ? (current.index + 1) % slides.length : 0,
      })
    }, duration)
    return () => window.clearTimeout(timer)
  }, [cover, engaged, frame, playbackPaused, slides.length, variant])

  useEffect(() => {
    if (frame.kind !== 'slide') return

    const tabs = tabsRef.current
    const activeTab = tabs?.querySelector<HTMLElement>(`[data-slide-index="${frame.index}"]`)
    if (!tabs || !activeTab || tabs.scrollWidth <= tabs.clientWidth) return

    tabs.scrollTo({
      left: centeredTabScrollLeft(
        activeTab.offsetLeft,
        activeTab.offsetWidth,
        tabs.clientWidth,
        tabs.scrollWidth - tabs.clientWidth,
      ),
      behavior: 'smooth',
    })
  }, [frame])

  const move = (direction: -1 | 1) => {
    setFrame((current) => ({
      kind: 'slide',
      index: current.kind === 'slide'
        ? (current.index + direction + slides.length) % slides.length
        : direction === 1 ? 0 : slides.length - 1,
    }))
    setUserControlled(true)
    manuallyPaused.current = true
    setPaused(true)
  }

  const moveRef = useRef(move)
  useEffect(() => {
    moveRef.current = move
  })
  const { swipeHandlers } = useSwipe((direction) => moveRef.current(direction))

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = { move: (direction) => moveRef.current(direction) }
    return () => { controlRef.current = null }
  }, [controlRef])

  const togglePlayback = () => {
    manuallyPaused.current = !paused
    setPaused(!paused)
  }

  if (slides.length === 0) return null

  return (
    <div
      ref={regionRef}
      className={`rd-preview-carousel rd-preview-carousel--${variant}`}
      data-interaction={variant === 'card' ? 'viewport-hover' : 'autoplay'}
      data-engaged={engaged === undefined ? undefined : engaged ? 'true' : 'false'}
      data-frame={frame.kind}
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      {...(variant === 'feature' ? swipeHandlers : {})}
      onMouseEnter={() => { if (!manuallyPaused.current) setPaused(false) }}
      onMouseLeave={() => { if (!focusWithin.current && variant === 'card') setPaused(true) }}
      onFocusCapture={() => { focusWithin.current = true; if (!manuallyPaused.current) setPaused(false) }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focusWithin.current = false
          setPaused(variant === 'card' ? true : manuallyPaused.current)
        }
      }}
    >
      {cover}
      <div className="rd-preview-content">
        <div className="rd-preview-viewport">
          {slides.map((slide, index) => {
            const isActive = index === active
            return (
              <div
                className="rd-preview-slide"
                data-active={isActive ? 'true' : 'false'}
                data-fit={slide.fit ?? 'cover'}
                aria-hidden={isActive ? undefined : 'true'}
                key={slide.src}
              >
                {slide.kind === 'coordination-diagram' ? (
                  <CoordinationDiagram variant={slide.diagramVariant} />
                ) : (
                  <Image
                    src={slide.src}
                    alt={isActive ? slide.alt : ''}
                    fill
                    quality={92}
                    priority={priority && index === 0}
                    sizes={variant === 'feature' ? '(max-width: 767px) 100vw, 62vw' : '(max-width: 767px) 100vw, 58vw'}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="rd-preview-controls">
          <span aria-live={userControlled ? 'polite' : 'off'}>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} · {slides[active].label}</span>
          <div>
            <button type="button" onClick={() => move(-1)} aria-label="Vista anterior">
              <svg className="rd-preview-control-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
            </button>
            <button type="button" onClick={togglePlayback} aria-label={paused ? 'Reanudar secuencia' : 'Pausar secuencia'}>
              {paused ? (
                <svg className="rd-preview-control-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5Z" /></svg>
              ) : (
                <svg className="rd-preview-control-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10M15 7v10" /></svg>
              )}
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Vista siguiente">
              <svg className="rd-preview-control-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
            </button>
          </div>
        </div>
        <div ref={tabsRef} className="rd-preview-tabs" role="group" aria-label="Seleccionar vista" tabIndex={0}>
          {slides.map((slide, index) => (
            <button key={slide.src} type="button" data-active={index === active ? 'true' : 'false'} data-slide-index={index} onClick={() => { setFrame({ kind: 'slide', index }); setUserControlled(true); manuallyPaused.current = true; setPaused(true) }}>
              {slide.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
