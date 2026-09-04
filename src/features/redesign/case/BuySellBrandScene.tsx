'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface BuySellBrandSceneProps {
  reducedMotion?: boolean
}

const TOKENS = ['8', '16', '24', '32']

export function BuySellBrandScene({ reducedMotion = false }: BuySellBrandSceneProps) {
  const sceneRef = useRef<HTMLElement>(null)
  const [isActive, setIsActive] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) return undefined
    const scene = sceneRef.current
    if (!scene) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: '12% 0px', threshold: 0.08 },
    )
    observer.observe(scene)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <figure
      ref={sceneRef}
      className="rd-buy-sell-scene"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      data-active={isActive}
      aria-label="Sistema de diseño convertido en producto digital"
    >
      <div className="rd-buy-sell-scene__copy">
        <span>Una identidad que se convierte en producto</span>
        <strong>De la materia al marketplace.</strong>
      </div>

      <div className="rd-buy-sell-scene__stage" aria-hidden="true">
        <div className="rd-buy-sell-scene__halo" />
        <div className="rd-buy-sell-scene__tokens">
          {TOKENS.map((token, index) => (
            <span key={token} className="rd-buy-sell-scene__token" style={{ '--token-index': index } as React.CSSProperties}>
              {token}
            </span>
          ))}
        </div>
        <div className="rd-buy-sell-scene__card">
          <div className="rd-buy-sell-scene__product" />
          <span className="rd-buy-sell-scene__condition">COMO NUEVO</span>
          <span className="rd-buy-sell-scene__price">545 €</span>
          <span className="rd-buy-sell-scene__name">Tecnología verificada</span>
          <span className="rd-buy-sell-scene__action">Ver detalle</span>
        </div>
        <div className="rd-buy-sell-scene__lockup">
          <span className="rd-buy-sell-scene__mark">
            <Image
              className="rd-buy-sell-scene__logo"
              src="/projects/buy-sell/logo-white.svg"
              alt=""
              width={118}
              height={28}
            />
          </span>
          <strong>Buy&amp;Sell</strong>
        </div>
      </div>
      <figcaption>Azul para estructurar, blanco para informar y naranja para activar.</figcaption>
    </figure>
  )
}
