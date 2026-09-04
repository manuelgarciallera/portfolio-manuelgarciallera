'use client'

import dynamic from 'next/dynamic'
import type { PointerEvent } from 'react'

const ResearchArtifactCanvas = dynamic(() => import('./ResearchArtifactCanvas').then((module) => module.ResearchArtifactCanvas), {
  ssr: false,
})

export function ResearchBanner() {
  const moveArtifact = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    event.currentTarget.style.setProperty('--artifact-x', x.toFixed(3))
    event.currentTarget.style.setProperty('--artifact-y', y.toFixed(3))
  }

  const resetArtifact = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--artifact-x', '0')
    event.currentTarget.style.setProperty('--artifact-y', '0')
  }

  return (
    <section
      id="investigacion"
      className="rd-research-banner rd-reveal"
      aria-labelledby="research-banner-title"
      onPointerMove={moveArtifact}
      onPointerLeave={resetArtifact}
    >
      <div className="rd-research-copy">
        <span>Práctica de investigación · HCI</span>
        <h2 id="research-banner-title">
          <span className="rd-research-title-line">Sistemas de interacción</span>{' '}
          <span className="rd-research-title-line">para contextos</span>{' '}
          <span className="rd-research-title-line">complejos.</span>
        </h2>
        <p>Diseño la relación entre personas, interfaces e IA; después la convierto en un sistema que puede probarse, explicarse y evolucionar.</p>
        <a href="/sobre-mi">Explorar la práctica <span aria-hidden="true">→</span></a>
      </div>
      <div className="rd-research-artifact" aria-hidden="true">
        <div className="rd-research-artifact-canvas">
          <ResearchArtifactCanvas />
        </div>
      </div>
    </section>
  )
}
