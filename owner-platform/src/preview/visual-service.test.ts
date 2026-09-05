import { describe, expect, it, vi } from 'vitest'
import { loadContentVisualPreview, loadPageVisualPreview } from './visual-service'

const req = { user: { collection: 'users', id: 1, role: 'owner' } }
const page = { id: 7, title: 'Inicio', updatedAt: '2026-09-05T10:00:00Z', _status: 'draft', layout: [
  { blockType: 'hero', heading: 'Una página', apiToken: 'secret' },
  { blockType: 'media', asset: 9, caption: 'Portada' },
  { blockType: 'customFeature', featureKey: 'project-reel', heading: 'Proyectos' },
] }

describe('private visual page preview', () => {
  it('loads article galleries with contextual alt and rejects unrelated placements', async () => {
    const findByID = vi.fn(async ({ collection }) => collection === 'articles' ? { title: 'Artículo', articleLayout: [
      { blockType: 'articleGallery', items: [{ asset: 9, alt: 'Primer uso', placement: 4 }, { asset: 9, alt: 'Segundo uso' }] },
      { blockType: 'articleQuote', quote: 'Idea', attribution: 'Fuente' },
    ] } : collection === 'media-placements' ? { placement: { asset: 8, frame: 'auto', fit: 'contain', focalX: .5, focalY: .5, zoom: 1, overrides: {} } } : { id: 9, url: '/api/media/file/cover.webp', alt: 'Original', width: 1200, height: 800 })
    const result = await loadContentVisualPreview({ payload: { findByID } as never, req: req as never, collection: 'articles', documentId: '2' })
    expect(result.collection).toBe('articles')
    expect(result.blocks.map((block) => block.type)).toEqual(['hero', 'gallery', 'quote'])
    expect(result.blocks[1].images?.map((image) => image.alt)).toEqual(['Primer uso', 'Segundo uso'])
    expect(result.blocks[1].images?.[0].placement).toBeUndefined()
    expect(result.warnings.join(' ')).toContain('encuadre')
    expect(findByID.mock.calls.filter(([args]) => args.collection === 'media')).toHaveLength(1)
  })
  it('rejects collections outside the editorial allowlist before reading', async () => {
    const findByID = vi.fn()
    await expect(loadContentVisualPreview({ payload: { findByID } as never, req: req as never, collection: 'users' as never, documentId: '2' })).rejects.toThrow(/colección/)
    expect(findByID).not.toHaveBeenCalled()
  })
  it('bounds gallery items before loading their media', async () => {
    const findByID = vi.fn(async () => ({ title: 'Proyecto', caseStudyLayout: [{ blockType: 'caseGallery', items: Array(13).fill({ asset: 9 }) }] }))
    await expect(loadContentVisualPreview({ payload: { findByID } as never, req: req as never, collection: 'projects', documentId: '2' })).rejects.toThrow(/12/)
    expect(findByID).toHaveBeenCalledTimes(1)
  })
  it('loads the saved draft with owner access and projects only display data in block order', async () => {
    const findByID = vi.fn(async ({ collection }) => collection === 'pages' ? page : { id: 9, url: '/api/media/file/cover.webp', width: 1200, height: 800, alt: 'Imagen', token: 'secret' })
    const result = await loadPageVisualPreview({ payload: { findByID } as never, req: req as never, pageId: '7' })
    expect(result.blocks.map((block) => block.type)).toEqual(['hero', 'media', 'customFeature'])
    expect(result.assets['9'].url).toBe('/api/media/file/cover.webp')
    expect(result.warnings).toContain('Sin perfil de marca: se muestra una base neutra.')
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'pages', draft: true, overrideAccess: false, req }))
  })
  it('denies anonymous access before loading any draft', async () => {
    const findByID = vi.fn()
    await expect(loadPageVisualPreview({ payload: { findByID } as never, req: { user: null } as never, pageId: '7' })).rejects.toThrow(/owner/)
    expect(findByID).not.toHaveBeenCalled()
  })
  it('keeps missing media visible as a warning without forwarding unsafe URLs', async () => {
    const findByID = vi.fn(async ({ collection }) => collection === 'pages' ? page : { id: 9, url: 'https://external.invalid/secret' })
    const result = await loadPageVisualPreview({ payload: { findByID } as never, req: req as never, pageId: '7' })
    expect(result.assets).toEqual({})
    expect(result.warnings.join(' ')).toMatch(/medio 9/)
  })
  it('rejects unsafe rich-text links before rendering', async () => {
    const findByID = vi.fn(async () => ({ ...page, layout: [{ blockType: 'richText', content: { root: { type: 'root', children: [{ type: 'link', fields: { linkType: 'custom', url: 'javascript:alert(1)' }, children: [] }] } } }] }))
    await expect(loadPageVisualPreview({ payload: { findByID } as never, req: req as never, pageId: '7' })).rejects.toThrow(/URL/)
  })
  it('reuses project reads and preserves deliberate repeated cards', async () => {
    const findByID = vi.fn(async ({ collection, id }) => collection === 'pages' ? { ...page, layout: [{ blockType: 'projectGrid', projects: [3, 3] }] } : { id, title: 'Proyecto', summary: 'Resumen' })
    const result = await loadPageVisualPreview({ payload: { findByID } as never, req: req as never, pageId: '7' })
    expect(result.blocks[0].projects?.map((project) => project.title)).toEqual(['Proyecto', 'Proyecto'])
    expect(findByID.mock.calls.filter(([args]) => args.collection === 'projects')).toHaveLength(1)
  })
  it('rejects oversized project grids before loading their relationships', async () => {
    const findByID = vi.fn(async () => ({ ...page, layout: [
      { blockType: 'projectGrid', projects: Array(100).fill(3) },
      { blockType: 'projectGrid', projects: Array(100).fill(3) },
      { blockType: 'projectGrid', projects: [3] },
    ] }))
    await expect(loadPageVisualPreview({ payload: { findByID } as never, req: req as never, pageId: '7' })).rejects.toThrow(/200 referencias/)
    expect(findByID).toHaveBeenCalledTimes(1)
  })
})
