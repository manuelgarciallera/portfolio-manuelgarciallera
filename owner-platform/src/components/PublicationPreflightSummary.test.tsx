import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/ui', () => ({ useDocumentInfo: () => ({ data: {
  artifact: 100,
  issueCount: 2,
  pageCount: 1,
  report: {
    issues: [
      { blockPosition: 1, code: 'media_asset_missing', message: 'El bloque de medios necesita un recurso.', pageId: '7', severity: 'blocker' },
      { code: 'seo_title_missing', message: 'Falta el título SEO.', pageId: '7', severity: 'warning' },
    ],
  },
  status: 'blocked',
} }) }))

import { PublicationPreflightSummary } from './PublicationPreflightSummary'

describe('PublicationPreflightSummary', () => {
  it('renders a bounded, accessible owner diagnosis with a route back to its artifact', () => {
    const markup = renderToStaticMarkup(<PublicationPreflightSummary />)
    expect(markup).toContain('Publicación bloqueada')
    expect(markup).toContain('2 incidencias en 1 página')
    expect(markup).toContain('Bloque 2')
    expect(markup).toContain('El bloque de medios necesita un recurso.')
    expect(markup).toContain('Falta el título SEO.')
    expect(markup).toContain('/admin/collections/publication-artifacts/100')
    expect(markup).toContain('no publica ni despliega')
  })
})
