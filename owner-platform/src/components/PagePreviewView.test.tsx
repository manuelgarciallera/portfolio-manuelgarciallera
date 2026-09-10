import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PagePreviewView } from './PagePreviewView'

const { load, loadSnapshot } = vi.hoisted(() => ({ load: vi.fn(), loadSnapshot: vi.fn() }))
vi.mock('../preview/visual-service', () => ({ loadContentVisualPreview: load }))
vi.mock('../preview/snapshot-visual', () => ({ loadSnapshotVisualPreview: loadSnapshot }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) }, notFound: () => { throw new Error('not-found') } }))
const owner = { collection: 'users', id: 1, role: 'owner' }
const args = (segments: string[], user: unknown = owner) => ({ params: { segments }, initPageResult: { req: { user, payload: {} } } }) as never

beforeEach(() => { load.mockReset(); load.mockResolvedValue({ title: 'Artículo', updatedAt: 'now', status: 'draft', warnings: [], blocks: [], assets: {}, brand: null }); loadSnapshot.mockReset(); loadSnapshot.mockResolvedValue({ title: 'Capturada', updatedAt: 'antes', status: 'snapshot', warnings: ['Relación no capturada'], blocks: [], assets: {}, brand: null }) })
describe('private content preview route', () => {
  it('renders a historical capture with its own return link, not the live draft loader', async () => {
    const markup = renderToStaticMarkup(await PagePreviewView(args(['snapshot-preview', '2'])))
    expect(loadSnapshot).toHaveBeenCalledWith(expect.objectContaining({ snapshotId: '2' }))
    expect(load).not.toHaveBeenCalled()
    expect(markup).toContain('Captura histórica: Capturada')
    expect(markup).toContain('/admin/collections/preview-snapshots/2')
    expect(markup).toContain('Relación no capturada')
    expect(markup).not.toContain('Publicado en el CMS')
  })
  it('guards snapshot identity and session before reads', async () => {
    await expect(PagePreviewView(args(['snapshot-preview', '2'], null))).rejects.toThrow('redirect:/admin/login')
    await expect(PagePreviewView(args(['snapshot-preview', '../2']))).rejects.toThrow('not-found')
    await expect(PagePreviewView(args(['snapshot-preview', '2', 'extra']))).rejects.toThrow('not-found')
    expect(loadSnapshot).not.toHaveBeenCalled()
  })
  it('shows a recoverable private failure without exposing snapshot errors', async () => {
    loadSnapshot.mockRejectedValue(new Error('secret database host'))
    const markup = renderToStaticMarkup(await PagePreviewView(args(['snapshot-preview', '2'])))
    expect(markup).toContain('No se pudo preparar la captura')
    expect(markup).not.toContain('secret database host')
  })
  it('redirects anonymous visitors before fetching content', async () => {
    await expect(PagePreviewView(args(['content-preview', 'articles', '7'], null))).rejects.toThrow('redirect:/admin/login')
    expect(load).not.toHaveBeenCalled()
  })
  it('rejects unsupported collections and malformed IDs before fetching', async () => {
    await expect(PagePreviewView(args(['content-preview', 'users', '7']))).rejects.toThrow('not-found')
    await expect(PagePreviewView(args(['content-preview', 'articles', '../7']))).rejects.toThrow('not-found')
    expect(load).not.toHaveBeenCalled()
  })
  it('routes article previews and their return link to the correct editor', async () => {
    const markup = renderToStaticMarkup(await PagePreviewView(args(['content-preview', 'articles', '7'])))
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ collection: 'articles', documentId: '7' }))
    expect(markup).toContain('/admin/collections/articles/7')
  })
  it('keeps existing page preview bookmarks working', async () => {
    await PagePreviewView(args(['page-preview', '7']))
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ collection: 'pages', documentId: '7' }))
  })
  it('does not expose internal errors in the failure view', async () => {
    load.mockRejectedValue(new Error('private database details'))
    const markup = renderToStaticMarkup(await PagePreviewView(args(['content-preview', 'projects', '7'])))
    expect(markup).toContain('No se pudo preparar')
    expect(markup).toContain('/admin/collections/projects/7')
    expect(markup).not.toContain('private database details')
  })
})
