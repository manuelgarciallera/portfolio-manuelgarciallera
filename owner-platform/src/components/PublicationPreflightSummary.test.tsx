import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ data: {} as Record<string, unknown> }))
vi.mock('@payloadcms/ui', () => ({ useDocumentInfo: () => ({ data: state.data }) }))
beforeEach(() => { state.data = {
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
} })

import { PublicationPreflightSummary } from './PublicationPreflightSummary'

describe('PublicationPreflightSummary', () => {
  it('renders a bounded, accessible owner diagnosis with a route back to its artifact', () => {
    const markup = renderToStaticMarkup(<PublicationPreflightSummary />)
    expect(markup).toContain('Revisión estructural: bloqueos')
    expect(markup).toContain('2 incidencias en 1 página')
    expect(markup).toContain('Bloque 2')
    expect(markup).toContain('El bloque de medios necesita un recurso.')
    expect(markup).toContain('Falta el título SEO.')
    expect(markup).toContain('/admin/collections/publication-artifacts/100')
    expect(markup).toContain('no publica ni despliega')
  })
  it('links populated Payload relationships and explains the limits of the check', () => {
    state.data.artifact = { id: 100, title: 'Artifact' }
    const markup = renderToStaticMarkup(<PublicationPreflightSummary />)
    expect(markup).toContain('/admin/collections/publication-artifacts/100')
    expect(markup).toContain('no certifica diseño, accesibilidad, rendimiento')
  })
  it.each([{ status: 'ready' }, { issueCount: 0 }, { pageCount: 0 }])('rejects contradictory summaries: %j', (changes) => {
    Object.assign(state.data, changes)
    expect(renderToStaticMarkup(<PublicationPreflightSummary />)).toContain('Informe no disponible')
  })
  it('validates issues beyond the visible first fifty', () => {
    const issue = { code: 'seo', message: 'Revisar SEO', pageId: '7', severity: 'warning' }
    state.data.report = { issues: [...Array.from({ length: 50 }, () => issue), { ...issue, pageId: '../invalid' }] }
    state.data.issueCount = 51
    state.data.status = 'ready_with_warnings'
    expect(renderToStaticMarkup(<PublicationPreflightSummary />)).toContain('Informe no disponible')
  })
})
