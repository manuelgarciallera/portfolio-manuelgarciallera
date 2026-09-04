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

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
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
          <HeroOrbCanvas isDark={isDark} reduceMotion={reduceMotion} onReady={() => setCanvasReady(true)} />
        </div>
      </div>
    </section>
  )
}
