import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { CaseVisualSlide } from '../content/types'
import { ProjectPreviewCarousel } from './ProjectPreviewCarousel'

describe('ProjectPreviewCarousel', () => {
  it('renders a semantic coordination flow instead of inventing a screenshot', () => {
    const slides = [{
      kind: 'coordination-diagram',
      label: 'Flujo verificable',
      src: '/diagram',
      alt: 'Flujo de coordinación verificable',
    }] as CaseVisualSlide[]

    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="Coordination Hub" slides={slides} />)

    expect(markup).toContain('aria-label="Flujo de coordinación verificable"')
    expect(markup).toContain('El usuario')
    expect(markup).not.toContain('Manuel')
    expect(markup).toContain('Claude')
    expect(markup).toContain('Codex')
    expect(markup).toContain('Evidencia')
    expect(markup).toContain('Consenso')
    expect(markup).toContain('Revisión independiente antes del consenso')
  })

  it('uses icon-only playback controls with accessible names', () => {
    const slides = [{ label: 'Producto final', src: '/producto.webp', alt: 'Producto final' }]

    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="Producto" slides={slides} />)

    expect(markup).toContain('aria-label="Vista anterior"')
    expect(markup).toContain('aria-label="Pausar secuencia"')
    expect(markup).toContain('aria-label="Vista siguiente"')
    expect(markup).toContain('rd-preview-control-icon')
    expect(markup).not.toContain('>Pausa<')

    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/\.rd-preview-controls button:hover\s*\{[^}]*color:\s*#d9ff43[^}]*transform:\s*none/)
  })

  it('preserves the full frame for portrait and system-detail slides', () => {
    const slides = [{
      label: 'Mobile',
      src: '/projects/example/mobile.webp',
      alt: 'Vista móvil',
      fit: 'contain' as const,
    }]

    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="Vista responsive" slides={slides} />)

    expect(markup).toContain('data-fit="contain"')
  })

  it('keeps every slide mounted so automatic changes can crossfade without a blank frame', () => {
    const markup = renderToStaticMarkup(
      <ProjectPreviewCarousel
        label="Secuencia fluida"
        slides={[
          { label: 'Primera', src: '/projects/example/first.webp', alt: 'Primera pantalla' },
          { label: 'Segunda', src: '/projects/example/second.webp', alt: 'Segunda pantalla' },
          { label: 'Tercera', src: '/projects/example/third.webp', alt: 'Tercera pantalla' },
        ]}
      />,
    )

    expect(markup).toContain('first.webp')
    expect(markup).toContain('second.webp')
    expect(markup).toContain('third.webp')
    expect(markup.match(/class="rd-preview-slide"/g)).toHaveLength(3)
  })

  it('marks card previews for viewport and hover activation', () => {
    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="Caso" slides={[{ label: 'Vista', src: '/vista.webp', alt: 'Vista' }]} />)
    expect(markup).toContain('data-interaction="viewport-hover"')
  })

  it('starts every card sequence on its editorial cover', () => {
    const markup = renderToStaticMarkup(
      <ProjectPreviewCarousel
        label="Caso"
        slides={[{ label: 'Vista', src: '/vista.webp', alt: 'Vista' }]}
        cover={<span data-testid="project-cover">Portada</span>}
        engaged
      />,
    )

    expect(markup).toContain('data-frame="cover"')
    expect(markup).toContain('data-testid="project-cover"')
  })

  it('returns an off-screen card to its cover before it can become active again', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/ProjectPreviewCarousel.tsx'), 'utf8')
    expect(source).toContain("if (variant !== 'card' || engaged !== false || !cover) return")
    expect(source).toContain("setFrame({ kind: 'cover' })")
  })

  it('requests high-density project frames without disabling optimization', () => {
    const slides = [{ label: 'Vista', src: '/vista.webp', alt: 'Vista' }]
    const card = renderToStaticMarkup(<ProjectPreviewCarousel label="Caso" slides={slides} engaged />)
    const feature = renderToStaticMarkup(<ProjectPreviewCarousel label="Caso" slides={slides} variant="feature" />)
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/ProjectPreviewCarousel.tsx'), 'utf8')
    expect(source).toContain('quality={92}')
    expect(card).toContain('(max-width: 767px) 100vw, 58vw')
    expect(feature).toContain('(max-width: 767px) 100vw, 62vw')
    expect(card).not.toContain('unoptimized')
  })
})
