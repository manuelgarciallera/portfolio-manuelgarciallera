'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Component, useEffect, useState, type ReactNode } from 'react'

const HeroOrbCanvas = dynamic(() => import('./HeroOrbCanvas').then((module) => module.HeroOrbCanvas), {
  ssr: false,
})

interface HeroProps {
  isDark?: boolean
}

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export function Hero({ isDark = true }: HeroProps) {
  const [canvasReady, setCanvasReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [canMountCanvas, setCanMountCanvas] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)

  // A stalled GPU/import must not leave an empty panel indefinitely.
  useEffect(() => {
    if (!canMountCanvas || canvasReady || reduceMotion || sceneFailed) return
    const timer = window.setTimeout(() => setSceneFailed(true), 15000)
    return () => window.clearTimeout(timer)
  }, [canMountCanvas, canvasReady, reduceMotion, sceneFailed])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // Mismo corte que usa el CSS para apilar el hero. La escena no puede deducirlo de
  // la relacion de aspecto del lienzo: en escritorio es 1.15 y en movil ~1.24, o
  // sea que el movil es el mas apaisado de los dos.
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsCompact(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // El titular y el nombre están en HTML; la escena no compite con ellos por el LCP.
  useEffect(() => {
    const idle = window.requestIdleCallback
    if (typeof idle === 'function') {
      const handle = idle(() => setCanMountCanvas(true), { timeout: 2500 })
      return () => window.cancelIdleCallback?.(handle)
    }
    const timer = window.setTimeout(() => setCanMountCanvas(true), 400)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section className="rd-hero" id="inicio">
      <div className="rd-hero-copy">
        <h1>
          Diseño sistemas digitales que conectan investigación, interfaz y código.
        </h1>
        <a href="#casos">Ver proyectos</a>
      </div>

      <div
        className="rd-hero-art"
        data-ready={canvasReady && !reduceMotion && !sceneFailed ? 'true' : 'false'}
        aria-hidden="true"
      >
        <div className="rd-hero-art-fallback">
          {(reduceMotion || sceneFailed) && <Image
            className="rd-hero-static-orb"
            src="/art/hero-refractive-orb-fallback-v2.webp"
            alt=""
            width={1400}
            height={1400}
            sizes="(max-width: 767px) 78vw, 42vw"
          />}
          <p className="rd-hero-fallback-name">Manuel García-Llera Añón</p>
        </div>
        <div className="rd-hero-canvas-stage">
          {canMountCanvas && !reduceMotion && !sceneFailed ? (
            <SceneBoundary onFailure={() => setSceneFailed(true)}>
              <HeroOrbCanvas isDark={isDark} reduceMotion={reduceMotion} isCompact={isCompact} onReady={() => setCanvasReady(true)} />
            </SceneBoundary>
          ) : null}
        </div>
      </div>
    </section>
  )
}
