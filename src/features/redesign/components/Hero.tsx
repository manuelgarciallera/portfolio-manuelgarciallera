'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const HeroOrbCanvas = dynamic(() => import('./HeroOrbCanvas').then((module) => module.HeroOrbCanvas), {
  ssr: false,
})

interface HeroProps {
  isDark?: boolean
}

export function Hero({ isDark = true }: HeroProps) {
  const [canvasReady, setCanvasReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [canMountCanvas, setCanMountCanvas] = useState(false)
  const [isCompact, setIsCompact] = useState(false)

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

  // El orbe pesa ~870 KB entre three y drei. Se monta cuando el navegador está
  // ocioso, para que el fallback estático pinte primero y no compita con el LCP.
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
        data-ready={canvasReady ? 'true' : 'false'}
        aria-hidden="true"
      >
        <Image
          className="rd-hero-art-fallback"
          src="/art/hero-refractive-orb-fallback-v2.webp"
          alt=""
          width={1400}
          height={1400}
          sizes="(max-width: 767px) 78vw, 42vw"
          fetchPriority="high"
          priority
        />
        <div className="rd-hero-canvas-stage">
          {/* Con `prefers-reduced-motion: reduce` no se descarga la escena: el
              fallback estático ya representa la misma pieza sin movimiento. */}
          {canMountCanvas && !reduceMotion ? (
            <HeroOrbCanvas isDark={isDark} reduceMotion={reduceMotion} isCompact={isCompact} onReady={() => setCanvasReady(true)} />
          ) : null}
        </div>
      </div>
    </section>
  )
}
