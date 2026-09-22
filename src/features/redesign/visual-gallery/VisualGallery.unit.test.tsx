import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VisualGallery } from './VisualGallery'

describe('visual project gallery', () => {
  it('offers labelled previous and next controls connected to its scroll region', () => {
    const html = renderToStaticMarkup(<VisualGallery />)
    expect(html).toContain('aria-label="Ver proyectos anteriores"')
    expect(html).toContain('aria-label="Ver proyectos siguientes"')
    expect(html).toMatch(/aria-label="Ver proyectos anteriores" aria-controls="art-gallery-track"/)
    expect(html).toMatch(/aria-label="Ver proyectos siguientes" aria-controls="art-gallery-track"/)
    expect(html).toContain('id="art-gallery-track"')
    expect(html.indexOf('aria-label="Ver proyectos siguientes"')).toBeGreaterThan(html.lastIndexOf('/proyectos/nude-project'))
  })
  it('offers five named case links with NudeProject last, not presentation screenshots', () => {
    const html = renderToStaticMarkup(<VisualGallery />)
    expect(html.match(/aria-label="Ver caso:/g)).toHaveLength(5)
    expect(html.lastIndexOf('/proyectos/nude-project')).toBeGreaterThan(html.lastIndexOf('/proyectos/the-ux-union'))
    expect(html).toContain('href="/proyectos/nude-project"')
    expect(html).toContain('theux-art.webp')
    expect(html).not.toContain('pitch-nodes')
  })
  it('keeps a labelled keyboard-scrollable region and lazy-loaded images', () => {
    const html = renderToStaticMarkup(<VisualGallery />)
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('aria-label="Galería de proyectos"')
    expect(html.match(/loading="lazy"/g)).toHaveLength(5)
  })
  it('exposes a compact draggable position control and a way to stop automatic movement', () => {
    const html = renderToStaticMarkup(<VisualGallery />)
    expect(html).toContain('type="range"')
    expect(html).toContain('aria-label="Posición de la galería de proyectos"')
    expect(html).toContain('aria-label="Pausar movimiento de la galería"')
  })
})
