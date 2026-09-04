import { describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createDraftCapsule } from '../recovery/capsule'
import { createOwnerPublicationBundle } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const capsule = createDraftCapsule({
  source: { collection: 'pages', documentId: '7', versionId: 'current:now' },
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})
const manifest = createPreviewManifest({
  brandTokens: { colors: [], motion: {}, usageWeights: [] }, mediaReferences: [], pageBlocks: [], source: capsule.source,
})

describe('createOwnerPublicationBundle', () => {
  it('derives every bundle entry from verified release snapshots and audits it', async () => {
    const create = vi.fn(async ({ collection, data }) => collection === 'publication-bundles' ? { id: 80, ...data } : { id: 81, ...data })
    const payload = {
      create,
      findByID: vi.fn(async ({ collection }) => {
        if (collection === 'releases') return { draftSnapshot: 13, id: 44, previewSnapshot: 12 }
        if (collection === 'draft-snapshots') return { capsule, capsuleHash: capsule.hash, id: 13 }
        return { id: 12, manifest, manifestHash: manifest.hash }
      }),
    }
    const result = await createOwnerPublicationBundle({
      confirmation: 'PREPARAR PUBLICACIÓN', name: 'Publicación septiembre', payload, releaseIds: [44], req: { user: owner },
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'publication-bundles',
      data: expect.objectContaining({
        bundle: expect.objectContaining({ entries: [expect.objectContaining({ pageId: '7', position: 0, releaseId: 44 })] }),
        createdBy: 1,
        pageCount: 1,
      }),
      overrideAccess: true,
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events', data: expect.objectContaining({ action: 'publication.bundle.created', subjectId: '80' }),
    }))
    expect(result).toMatchObject({ id: 80, name: 'Publicación septiembre' })
  })

  it('rejects anonymous use, mismatched source revisions and duplicate pages', async () => {
    await expect(createOwnerPublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: 'x', payload: {} as never, releaseIds: [44], req: { user: null } })).rejects.toThrow(/owner/i)
    const mismatched = createPreviewManifest({
      brandTokens: { colors: [], motion: {}, usageWeights: [] }, mediaReferences: [], pageBlocks: [],
      source: { ...capsule.source, versionId: 'current:other' },
    })
    const payload = {
      create: vi.fn(),
      findByID: vi.fn(async ({ collection }) => collection === 'releases'
        ? { draftSnapshot: 13, id: 44, previewSnapshot: 12 }
        : collection === 'draft-snapshots'
          ? { capsule, capsuleHash: capsule.hash, id: 13 }
          : { id: 12, manifest: mismatched, manifestHash: mismatched.hash }),
    }
    await expect(createOwnerPublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: 'x', payload, releaseIds: [44], req: { user: owner } })).rejects.toThrow(/revisión|snapshot/i)
    expect(payload.create).not.toHaveBeenCalled()
  })
})
