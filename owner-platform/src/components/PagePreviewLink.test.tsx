import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { PagePreviewLink } from './PagePreviewLink'
const state = vi.hoisted(() => ({ id: 2, collectionSlug: 'preview-snapshots' }))
vi.mock('@payloadcms/ui', () => ({ useDocumentInfo: () => state }))
it('links a stored capture to the historical view, not the live draft', () => {
  const html = renderToStaticMarkup(<PagePreviewLink />)
  expect(html).toContain('/admin/snapshot-preview/2')
  expect(html).toContain('Ver captura histórica')
  expect(html).not.toContain('content-preview')
})
