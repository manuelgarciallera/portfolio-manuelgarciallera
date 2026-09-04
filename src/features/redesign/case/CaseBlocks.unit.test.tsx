import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PhaseSection, PrototypeToComponent } from './CaseBlocks'

describe('PhaseSection', () => {
  it('pairs the explanation with project evidence when a visual is available', () => {
    const markup = renderToStaticMarkup(
      <PhaseSection
        order={1}
        phase={{ id: 'research', title: 'Problema', paragraphs: ['Una decisión concreta.'] }}
        visual={{
          label: 'Mapa del sistema',
          src: '/projects/buy-sell/foundations-hd.webp',
          alt: 'Mapa de fundamentos de Buy&Sell',
          fit: 'contain',
        }}
        theme="buy-sell"
      />,
    )

    expect(markup).toContain('rd-case-phase--with-visual')
    expect(markup).toContain('foundations-hd.webp')
    expect(markup).toContain('Mapa del sistema')
    expect(markup).toContain('rd-case-phase__frame rd-case-phase__frame--buy-sell')
    expect(markup).toContain('data-fit="contain"')
  })

  it('uses the project diagram as evidence instead of leaving the phase text-only', () => {
    const markup = renderToStaticMarkup(
      <PhaseSection
        order={1}
        phase={{ id: 'research', title: 'Problema', paragraphs: ['Una decisión concreta.'] }}
        visual={{
          kind: 'coordination-diagram',
          diagramVariant: 'consensus',
          label: 'Puerta de consenso',
          src: 'diagram:consensus',
          alt: 'Revisión antes del consenso',
        }}
        theme="coordination"
      />,
    )

    expect(markup).toContain('rd-case-phase--with-visual')
    expect(markup).toContain('Puerta de consenso')
    expect(markup).toContain('Revisión independiente')
  })
})

describe('PrototypeToComponent', () => {
  it('keeps its comparison headings sequential and scrollable evidence keyboard-accessible', () => {
    const markup = renderToStaticMarkup(
      <PrototypeToComponent
        figmaLayers={['atoms / badge']}
        codeEvidence={{ filename: 'badge.ts', code: 'export const badge = true', caption: 'Evidencia' }}
        dataMapping="status = 'published'"
      />,
    )

    expect(markup).toContain('<h3>Figma · sistema atomizado</h3>')
    expect(markup).toContain('<h3>Angular · componente real</h3>')
    expect(markup).not.toContain('<h4>')
    expect(markup).toContain('<pre class="rd-code" aria-label="badge.ts" tabindex="0">')
    expect(markup).toContain('aria-label="Mapeo entre interfaz y datos" tabindex="0"')
  })
})
