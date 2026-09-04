import { describe, expect, it, vi } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from './artifact'
import { createPublicationBundle } from './bundle'
import { createPublicationReview } from './review'
import { createOwnerPublicationArtifact } from './artifact-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' } })
const bundle = createPublicationBundle({ entries: [{ capsule, draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now' }] })
const review = createPublicationReview({ bundleHash: bundle.hash, bundleId: 80, decision: 'approved', decidedAt: '2026-09-04T22:00:00.000Z', decidedBy: 1 })

describe('createOwnerPublicationArtifact', () => {
  it('derives an immutable artifact only from an approved, verified review and audits it', async () => {
    const create = vi.fn(async ({ collection, data }) => collection === 'publication-artifacts' ? { id: 100, ...data } : { id: 101, ...data })
    const payload = {
      create, find: vi.fn(async () => ({ docs: [] })),
      findByID: vi.fn(async ({ collection }) => collection === 'publication-reviews'
        ? { ...review, bundle: 80, id: 90, reviewHash: review.hash }
        : { bundle, bundleHash: bundle.hash, id: 80, pageCount: 1 }),
    }
    const result = await createOwnerPublicationArtifact({ confirmation: 'GENERAR ARTEFACTO', payload, req: { user: owner }, reviewId: 90 })
    const expected = createPublicationArtifact({ bundleHash: bundle.hash, bundleId: 80, pageCount: 1, reviewHash: review.hash, reviewId: 90 })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'publication-artifacts', data: expect.objectContaining({ artifact: expected, artifactHash: expected.hash, createdBy: 1 }) }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'publication.artifact.created', subjectId: '100' }) }))
    expect(result).toMatchObject({ id: 100, artifactHash: expected.hash })
  })

  it('rejects rejected reviews and duplicate artifact generation', async () => {
    const base = { create: vi.fn(), find: vi.fn(async () => ({ docs: [] })), findByID: vi.fn(async () => ({ ...review, bundle: 80, decision: 'rejected', id: 90, reviewHash: review.hash })) }
    await expect(createOwnerPublicationArtifact({ confirmation: 'GENERAR ARTEFACTO', payload: base, req: { user: owner }, reviewId: 90 })).rejects.toThrow(/aprobada/i)
    const duplicate = { ...base, find: vi.fn(async () => ({ docs: [{ id: 100 }] })) }
    await expect(createOwnerPublicationArtifact({ confirmation: 'GENERAR ARTEFACTO', payload: duplicate, req: { user: owner }, reviewId: 90 })).rejects.toThrow(/existe|generado/i)
  })
})
