import { describe, expect, it, vi } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationBundle } from './bundle'
import { createOwnerPublicationReview } from './review-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const capsule = createDraftCapsule({
  source: { collection: 'pages', documentId: '7', versionId: 'current:now' },
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})
const bundle = createPublicationBundle({ entries: [{
  capsule, draftHash: capsule.hash, pageId: '7', position: 0,
  previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now',
}] })
const bundleHash = bundle.hash

describe('createOwnerPublicationReview', () => {
  it('verifies the immutable bundle, prevents repeat decisions and audits approval', async () => {
    const create = vi.fn(async ({ collection, data }) => collection === 'publication-reviews' ? { id: 90, ...data } : { id: 91, ...data })
    const payload = {
      create,
      find: vi.fn(async () => ({ docs: [] })),
      findByID: vi.fn(async () => ({ bundle, bundleHash, id: 80 })),
    }
    const result = await createOwnerPublicationReview({
      bundleId: 80, confirmation: 'APROBAR PAQUETE', decision: 'approved', now: '2026-09-04T22:00:00.000Z',
      note: 'Revisado.', payload, req: { user: owner },
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'publication-reviews',
      data: expect.objectContaining({ bundle: 80, bundleHash, decision: 'approved', decidedBy: 1 }),
      overrideAccess: true,
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events', data: expect.objectContaining({ action: 'publication.bundle.approved', subjectId: '80' }),
    }))
    expect(result).toMatchObject({ id: 90, decision: 'approved' })
  })

  it('rejects anonymous, repeated and mismatched confirmations', async () => {
    await expect(createOwnerPublicationReview({ bundleId: 80, confirmation: 'APROBAR PAQUETE', decision: 'approved', payload: {} as never, req: { user: null } })).rejects.toThrow(/owner/i)
    const payload = {
      create: vi.fn(), findByID: vi.fn(async () => ({ bundle, bundleHash, id: 80 })),
      find: vi.fn(async () => ({ docs: [{ id: 90 }] })),
    }
    await expect(createOwnerPublicationReview({ bundleId: 80, confirmation: 'APROBAR PAQUETE', decision: 'approved', payload, req: { user: owner } })).rejects.toThrow(/decidido|revisado/i)
    await expect(createOwnerPublicationReview({ bundleId: 80, confirmation: 'RECHAZAR PAQUETE', decision: 'approved', payload: { ...payload, find: vi.fn(async () => ({ docs: [] })) }, req: { user: owner } })).rejects.toThrow(/confirmación/i)
  })
})
