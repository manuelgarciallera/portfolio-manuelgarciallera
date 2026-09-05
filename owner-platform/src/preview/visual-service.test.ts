import { describe, expect, it, vi } from 'vitest'
import { loadPageVisualPreview } from './visual-service'

const req = { user: { collection: 'users', id: 1, role: 'owner' } }
const page = { id: 7, title: 'Inicio', updatedAt: '2026-09-05T10:00:00Z', _status: 'draft', layout: [
  { blockType: 'hero', heading: 'Una página', apiToken: 'secret' },
  { blockType: 'media', asset: 9, caption: 'Portada' },
  { blockType: 'customFeature', featureKey: 'project-reel', heading: 'Proyectos' },
] }

describe('private visual page preview', () => {
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
