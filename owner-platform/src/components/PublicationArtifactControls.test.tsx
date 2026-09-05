import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/ui', () => ({ useDocumentInfo: () => ({ id: 100 }) }))

import { PublicationArtifactControls } from './PublicationArtifactControls'

describe('PublicationArtifactControls', () => {
  it('offers owner validation before the existing non-publishing JSON download', () => {
    const markup = renderToStaticMarkup(<PublicationArtifactControls />)
    expect(markup).toContain('VALIDAR ARTEFACTO')
    expect(markup).toContain('Validar preparación')
    expect(markup).toContain('/api/owner/publication-artifacts/100/export')
    expect(markup).toContain('No escribe, publica ni despliega')
  })
})
