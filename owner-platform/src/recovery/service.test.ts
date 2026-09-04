import { describe, expect, it, vi } from 'vitest'

import { createPageDraftSnapshot } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('createPageDraftSnapshot', () => {
  it('projects a complete whitelisted page draft into an immutable audited capsule', async () => {
    const create = vi.fn(async ({ collection, data }) =>
      collection === 'draft-snapshots' ? { id: 70, ...data } : { id: 71, ...data },
    )
    const payload = {
      create,
      findByID: vi.fn(async () => ({
        _status: 'published',
        brandOverrides: { accent: '#FF4B44' },
        brandProfile: 3,
        id: 7,
        layout: [{ blockType: 'hero', heading: 'Hola', image: 9 }],
        secretDraftNote: 'must-not-leak',
        slug: 'inicio',
        title: 'Inicio',
        updatedAt: '2026-09-04T23:00:00.000Z',
      })),
    }
    const result = await createPageDraftSnapshot({ payload, req: { user: owner }, pageId: 7 })
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'pages', depth: 0, draft: true, id: 7, overrideAccess: false }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'draft-snapshots',
      data: expect.objectContaining({
        capsule: expect.objectContaining({ state: expect.objectContaining({ title: 'Inicio', slug: 'inicio', brandProfile: 3 }) }),
        createdBy: 1,
        sourceDocumentId: '7',
      }),
      overrideAccess: true,
    }))
    const persisted = create.mock.calls.find(([args]) => args.collection === 'draft-snapshots')?.[0]
    expect(JSON.stringify(persisted)).not.toMatch(/published|secretDraftNote|must-not-leak/)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ action: 'draft.snapshot.created', subjectId: '7' }),
    }))
    expect(result).toMatchObject({ id: 70 })
  })

  it('rejects anonymous access and pages without a complete restorable state', async () => {
    await expect(createPageDraftSnapshot({ payload: {} as never, req: { user: null }, pageId: 7 })).rejects.toThrow(/owner/i)
    const payload = { create: vi.fn(), findByID: vi.fn(async () => ({ id: 7, title: 'Sin datos' })) }
    await expect(createPageDraftSnapshot({ payload, req: { user: owner }, pageId: 7 })).rejects.toThrow(/borrador|página|estado/i)
    expect(payload.create).not.toHaveBeenCalled()
  })
})
