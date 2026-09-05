import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PagePreviewDocument } from './PagePreviewDocument'
import type { PageVisualPreview } from '../preview/visual-service'

const preview: PageVisualPreview = { id: '7', title: 'Página', updatedAt: 'now', status: 'draft', brand: null, warnings: [], assets: {
  '9': { id: 9, url: '/api/media/file/cover.webp', alt: 'Portada', width: 1200, height: 800 },
}, blocks: [
  { type: 'hero', heading: 'Primero' },
  { type: 'media', assetId: '9', caption: 'Segundo', placement: { asset: 9, frame: '16:9', fit: 'cover', focalX: .3, focalY: .5, zoom: 1, overrides: { mobile: { frame: '9:16', focalX: .8 } } } },
  { type: 'customFeature', featureKey: 'project-reel' },
] }

describe('editorial page rendering', () => {
  it('preserves block order, captions and separate responsive crop settings', () => {
    const markup = renderToStaticMarkup(<PagePreviewDocument preview={preview} />)
    expect(markup.indexOf('Primero')).toBeLessThan(markup.indexOf('Segundo'))
    expect(markup).toContain('alt="Portada"')
    expect(markup).toContain('--desktop-ratio:16 / 9')
    expect(markup).toContain('--mobile-ratio:9 / 16')
    expect(markup).toContain('--mobile-position:80% 50%')
    expect(markup).toContain('no están conectadas a esta vista editorial')
  })
  it('does not turn arbitrary heading tags into executable HTML', () => {
    const content = { root: { type: 'root', version: 1, direction: null, format: '' as const, indent: 0, children: [{ type: 'heading', tag: 'script', version: 1, children: [{ type: 'text', text: '<script>alert(1)</script>', version: 1, format: 0 }] }] } }
    const markup = renderToStaticMarkup(<PagePreviewDocument preview={{ ...preview, blocks: [{ type: 'richText', content }] }} />)
    expect(markup).not.toContain('<script>')
    expect(markup).toContain('&lt;script&gt;')
  })
  it('makes a missing image explicit rather than leaving a blank frame', () => {
    expect(renderToStaticMarkup(<PagePreviewDocument preview={{ ...preview, assets: {} }} />)).toContain('Imagen no disponible')
  })
})
