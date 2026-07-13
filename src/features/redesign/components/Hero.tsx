'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const HeroOrbCanvas = dynamic(
  () => import('./HeroOrbCanvas').then((m) => m.HeroOrbCanvas),
  { ssr: false },
)

interface HeroProps {
  isDark: boolean
  reduceMotion: boolean
}

export function Hero({ isDark, reduceMotion }: HeroProps) {
  const [canvasReady, setCanvasReady] = useState(false)

  return (
    <section className={`rd-hero${canvasReady ? ' canvas-on' : ''}`} id="inicio">
      <div className="rd-hero-canvas">
        <HeroOrbCanvas isDark={isDark} reduceMotion={reduceMotion} onReady={() => setCanvasReady(true)} />
      </div>

      <p className="rd-hero-kicker rd-label" data-index="—">
        AI Design Engineer
      </p>

      {/* Nombre visible como fallback; el lienzo 3D lo sustituye con la misma tipografía */}
      <h1 className="rd-hero-name" aria-hidden={canvasReady}>
        Manuel
        <br />
        García-Llera
      </h1>
      <span className="rd-sr-only">Manuel García-Llera — AI Design Engineer</span>

      <p className="rd-hero-specialties">
        UX/UI · HCI · <em>Figma prototyping</em> · Frontend development · <em>Human-AI interaction</em>
      </p>

      <p className="rd-hero-corner">
        <strong>Madrid, ES</strong>
        <br />
        Diseño · Prototipado · Desarrollo
        <br />
        Disponible para colaborar
      </p>

      <p className="rd-hero-scroll">Scroll</p>
    </section>
  )
}
