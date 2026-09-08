import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VisualGallery } from './VisualGallery'

describe('visual project gallery', () => {
  it('offers five named case links with NudeProject last, not presentation screenshots', () => {
    const html = renderToStaticMarkup(<VisualGallery />)
    expect(html.match(/aria-label="Ver caso:/g)).toHaveLength(5)
    expect(html.lastIndexOf('/casos/nude-project')).toBeGreaterThan(html.lastIndexOf('/casos/the-ux-union'))
    expect(html).toContain('theux-art.webp')
    expect(html).not.toContain('pitch-nodes')
  })
  it('keeps a labelled keyboard-scrollable region and lazy-loaded images', () => {
    const html = renderToStaticMarkup(<VisualGallery />)
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('aria-label="Galería de proyectos"')
    expect(html.match(/loading="lazy"/g)).toHaveLength(5)
  })
})
