import { describe, expect, it, vi } from 'vitest'
import { createPagePreviewSnapshot } from './service'
import { buildAssistanceContextPackage } from '../assist/context'
import type { PreviewManifest } from './manifest'

const owner = { id: 1, collection: 'users', role: 'owner' }
const lexical = { root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [
  { type: 'text', version: 1, text: 'Hola', format: 1, style: 'color: red', apiToken: 'must-not-pass' },
  { type: 'link', version: 1, fields: { linkType: 'custom', url: 'https://example.com', newTab: true }, children: [{ type: 'text', version: 1, text: 'Web', format: 0 }] },
  { type: 'autolink', version: 1, fields: { url: '/casos' }, children: [{ type: 'text', version: 1, text: 'Casos', format: 0 }] },
  { type: 'upload', version: 1, format: '', id: 'upload-node-1', fields: { apiToken: 'drop-me' }, relationTo: 'media', value: 10 },
  { type: 'relationship', version: 1, relationTo: 'projects', value: 4 },
  { type: 'link', version: 1, fields: { linkType: 'internal', doc: { relationTo: 'pages', value: 8 } }, children: [{ type: 'text', version: 1, text: 'Interno', format: 0 }] },
] }] } }
const brand = {
  id: 3,
  colors: [
    { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
    { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
    { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
    { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
  ],
  usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
  motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
}

describe('page preview snapshot service', () => {
  it('distinguishes reordered identical blocks by their stored identities in the assistant context', async () => {
    const page = { id: 7, title: 'Inicio', updatedAt: '2026-09-05T12:00:00Z', brandProfile: 3,
      layout: [{ id: 'block-a', blockType: 'hero', heading: 'Igual' }, { id: 'block-b', blockType: 'hero', heading: 'Igual' }] }
    const snapshots: Record<string, unknown>[] = []
    const payload = {
      findByID: async ({ collection }: { collection: string }) => collection === 'pages' ? page : brand,
      find: async ({ where }: { where: { manifestHash: { equals: string } } }) => ({ docs: snapshots.filter((doc) => doc.manifestHash === where.manifestHash.equals) }),
      create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        const doc = { id: snapshots.length + 1, ...data }
        if (collection === 'preview-snapshots') snapshots.push(doc)
        return doc
      },
    }
    const first = await createPagePreviewSnapshot({ payload: payload as never, req: { user: owner } as never, pageId: 7 })
    page.layout = [page.layout[1], page.layout[0]]
    const second = await createPagePreviewSnapshot({ payload: payload as never, req: { user: owner } as never, pageId: 7 })
    expect(second.manifestHash).not.toBe(first.manifestHash)
    expect(buildAssistanceContextPackage(second.manifest as PreviewManifest, { suggestLayout: true }).context.page.layout).toEqual([
      { id: 'block-b', blockType: 'hero', heading: 'Igual' },
      { id: 'block-a', blockType: 'hero', heading: 'Igual' },
    ])
    expect((first.manifest as PreviewManifest).pageBlocks).toEqual([
      { id: 'block-a', blockType: 'hero', heading: 'Igual' },
      { id: 'block-b', blockType: 'hero', heading: 'Igual' },
    ])
  })

  it.each(['', 'path/segment', 'x'.repeat(129), 7, null])('rejects malformed block identity %s before persisting a capture', async (id) => {
    const page = { id: 7, updatedAt: 'now', brandProfile: 3, layout: [{ id, blockType: 'hero', heading: 'Hola' }] }
    const create = vi.fn(async ({ data }) => ({ id: 22, ...data }))
    const payload = { findByID: async ({ collection }: { collection: string }) => collection === 'pages' ? page : brand, find: async () => ({ docs: [] }), create }
    await expect(createPagePreviewSnapshot({ payload: payload as never, req: { user: owner } as never, pageId: 7 })).rejects.toThrow(/identificador/i)
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects duplicate block identities across block families before persisting', async () => {
    const page = { id: 7, updatedAt: 'now', brandProfile: 3, layout: [
      { id: 'same', blockType: 'hero', heading: 'Uno' }, { id: 'same', blockType: 'customFeature', featureKey: 'contact-panel' },
    ] }
    const create = vi.fn(async ({ data }) => ({ id: 22, ...data }))
    const payload = { findByID: async ({ collection }: { collection: string }) => collection === 'pages' ? page : brand, find: async () => ({ docs: [] }), create }
    await expect(createPagePreviewSnapshot({ payload: payload as never, req: { user: owner } as never, pageId: 7 })).rejects.toThrow(/identificador/i)
    expect(create).not.toHaveBeenCalled()
  })

  it('loads the current draft, brand and media server-side and projects only known fields', async () => {
    const page = { id: 7, title: 'Inicio', slug: 'inicio', updatedAt: '2026-09-04T12:00:00Z', brandProfile: 3, apiToken: 'page-secret', layout: [{ blockType: 'hero', eyebrow: 'Hola', heading: 'Portfolio', body: lexical, image: 9, customCSS: 'no' }, { blockType: 'richText', content: lexical }, { blockType: 'media', asset: 9, placement: 14, caption: 'Encuadre controlado' }] }
    const create = vi.fn(async ({ data }) => ({ id: 22, ...data }))
    const findByID = vi.fn(async ({ collection, id }) => collection === 'pages' ? page : collection === 'brand-profiles' ? brand : { id, alt: 'Portada', filename: 'cover.webp', mimeType: 'image/webp', width: 1200, height: 800, apiToken: 'media-secret' })
    const result = await createPagePreviewSnapshot({ payload: { find: async () => ({ docs: [] }), findByID, create } as never, req: { user: owner } as never, pageId: 7 })

    expect(result.manifest).toHaveProperty('pageTitle', 'Inicio')
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'pages', id: 7, draft: true, depth: 0, overrideAccess: false }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'preview-snapshots', overrideAccess: true, req: expect.anything() }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({
        action: 'preview.snapshot.created',
        actor: 1,
        outcome: 'success',
        subjectCollection: 'pages',
        subjectId: '7',
      }),
      overrideAccess: true,
    }))
    expect((result.manifest as never as { source: unknown }).source).toEqual({ collection: 'pages', documentId: '7', versionId: 'current:2026-09-04T12:00:00Z' })
    expect(JSON.stringify(result.manifest)).not.toMatch(/(?:apiToken|customCSS|page-secret|media-secret)/)
    expect(JSON.stringify(result.manifest)).toContain('"style":""')
    expect(JSON.stringify(result.manifest)).toContain('https://example.com')
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', id: 10 }))
    expect(findByID.mock.calls.filter(([argument]) => argument.collection === 'media' && argument.id === 10)).toHaveLength(1)
    expect(JSON.stringify(result.manifest)).toContain('"id":"upload-node-1"')
    expect(JSON.stringify(result.manifest)).toContain('"fields":{}')
    expect(JSON.stringify(result.manifest)).toContain('"placement":"14"')
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>1</script>', 'https://example.com/\u0000bad', '//evil.example/x', '/\\evil', '\\evil', '/%5C%5Cevil'])(
    'rejects unsafe authored URL %s',
    async (url) => {
      const page = { id: 9, title: 'Unsafe', slug: 'unsafe', updatedAt: 'now', brandProfile: 3, layout: [{ blockType: 'richText', content: { root: { type: 'root', version: 1, children: [{ type: 'link', version: 1, fields: { linkType: 'custom', url }, children: [] }] } } }] }
      const findByID = vi.fn(async ({ collection }) => collection === 'pages' ? page : brand)
      await expect(createPagePreviewSnapshot({ payload: { findByID, create: vi.fn() } as never, req: { user: owner } as never, pageId: 9 })).rejects.toThrow(/URL/i)
    },
  )

  it('rejects a noncanonical upload node missing its required node id', async () => {
    const page = { id: 10, title: 'Upload', slug: 'upload', updatedAt: 'now', brandProfile: 3, layout: [{ blockType: 'richText', content: { root: { type: 'root', version: 1, children: [{ type: 'upload', version: 1, fields: {}, relationTo: 'media', value: 10 }] } } }] }
    const findByID = vi.fn(async ({ collection }) => collection === 'pages' ? page : brand)
    await expect(createPagePreviewSnapshot({ payload: { findByID, create: vi.fn() } as never, req: { user: owner } as never, pageId: 10 })).rejects.toThrow(/Upload|id/i)
  })

  it('rejects missing owner, missing brand and unsupported blocks', async () => {
    await expect(createPagePreviewSnapshot({ payload: {} as never, req: { user: null } as never, pageId: 7 })).rejects.toThrow(/owner/i)
    const basePayload = { create: vi.fn(), findByID: vi.fn(async () => ({ id: 7, updatedAt: 'now', brandProfile: null, layout: [] })) }
    await expect(createPagePreviewSnapshot({ payload: basePayload as never, req: { user: owner } as never, pageId: 7 })).rejects.toThrow(/marca/i)
    const unsupported = { ...basePayload, findByID: vi.fn(async ({ collection }) => collection === 'pages' ? { id: 7, title: 'x', slug: 'x', updatedAt: 'now', brandProfile: 3, layout: [{ blockType: 'code' }] } : brand) }
    await expect(createPagePreviewSnapshot({ payload: unsupported as never, req: { user: owner } as never, pageId: 7 })).rejects.toThrow(/bloque/i)
  })

  it('omits absent optional fields instead of emitting non-JSON undefined values', async () => {
    const page = { id: 8, title: 'Minimal', slug: 'minimal', updatedAt: 'now', brandProfile: 3, layout: [{ blockType: 'customFeature', featureKey: 'contact-panel' }] }
    const create = vi.fn(async ({ data }) => ({ id: 23, ...data }))
    const findByID = vi.fn(async ({ collection }) => collection === 'pages' ? page : brand)
    await expect(createPagePreviewSnapshot({ payload: { find: async () => ({ docs: [] }), findByID, create } as never, req: { user: owner } as never, pageId: 8 })).resolves.toMatchObject({ id: 23 })
  })
})
