import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { CaseVisualSlide } from '../content/types'
import { ProjectPreviewCarousel } from './ProjectPreviewCarousel'

describe('ProjectPreviewCarousel', () => {
  it('fits a portrait into its own proportional device frame instead of rounding a landscape image box', () => {
    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="NudeProject" slides={[{ src: '/projects/nude-project/mobile-home.webp', label: 'Inicio', alt: 'Inicio móvil', fit: 'contain' }]} />)
    expect(markup).toContain('class="rd-preview-portrait" data-device="true" style="aspect-ratio:1290 / 2796"')
    expect(markup).toContain('sizes="(max-width: 760px) 45vw, 23rem"')
  })
  it('keeps the project technology stack legible across desktop and mobile', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-tech-stack__item svg\s*\{[^}]*width:\s*1\.75rem[^}]*height:\s*1\.75rem/)
    expect(css).toMatch(/\.rd-tech-stack__item\s*\{[^}]*row-gap:\s*\.45rem[^}]*font-size:\s*\.7rem/)
    expect(css).toMatch(/@media\s*\(max-width:\s*760px\)[^{]*\{[\s\S]*?\.rd-tech-stack__item svg\s*\{[^}]*width:\s*1\.5rem[^}]*height:\s*1\.5rem/)
  })

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
    expect(markup).toContain('Portada')
    expect(markup).not.toContain('aria-current="true"')
  })

  it('communicates the selected view independently of its visual styling', () => {
    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="Caso" slides={[
      { label: 'Primera', src: '/primera.webp', alt: 'Primera' },
      { label: 'Segunda', src: '/segunda.webp', alt: 'Segunda' },
    ]} variant="feature" />)
    expect(markup.match(/aria-current="true"/g)).toHaveLength(1)
  })

  it('keeps all six long-label views individually selectable when the selector must scroll', () => {
    const labels = ['Mobile · Descubrir', 'Mobile · Nodos', 'Sistema · Identidad', 'Sistema · Componentes', 'Desktop implementado', 'Pitch · Nodos']
    const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="TheUXUnion" variant="feature" slides={labels.map((label, index) => ({
      label, src: `/vista-${index}.webp`, alt: label,
    }))} />)
    expect(markup.match(/data-slide-index="[0-5]"/g)).toHaveLength(6)
    for (const label of labels) expect(markup).toContain(`>${label}</button>`)
    expect(markup.match(/aria-current="true"/g)).toHaveLength(1)
  })

  it('returns an off-screen card to its cover before it can become active again', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/ProjectPreviewCarousel.tsx'), 'utf8')
    expect(source).toContain("if (variant !== 'card' || engaged !== false || !cover || manuallyPaused.current) return")
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
