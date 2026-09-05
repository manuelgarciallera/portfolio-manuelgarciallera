import { describe, expect, it } from 'vitest'

import { createPublicationReview } from '../publication/review'
import { enforcePublicationReviewDelete, preparePublicationReview, PublicationReviews } from './PublicationReviews'

const owner = { id: 1, collection: 'users', role: 'owner' }
const review = createPublicationReview({
  bundleHash: `sha256:${'a'.repeat(64)}`, bundleId: 80, decision: 'approved',
  decidedAt: '2026-09-04T22:00:00.000Z', decidedBy: 1,
})

describe('PublicationReviews collection', () => {
  it('is immutable, owner-readable and closed to direct client mutation', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(PublicationReviews.slug).toBe('publication-reviews')
    expect(PublicationReviews.access?.read?.(access(owner))).toBe(true)
    expect(PublicationReviews.access?.read?.(access(null))).toBe(false)
    expect(PublicationReviews.access?.create?.(access(owner))).toBe(false)
    expect(PublicationReviews.access?.update?.(access(owner))).toBe(false)
    expect(PublicationReviews.access?.delete?.(access(owner))).toBe(false)
    expect(PublicationReviews.admin?.components?.edit?.beforeDocumentControls).toEqual([
      './components/PublicationReviewControls#PublicationReviewControls',
    ])
  })

  it('accepts only matching canonical data and owner provenance', async () => {
    const data = {
      bundle: 80, bundleHash: review.bundleHash, decision: review.decision, decidedAt: review.decidedAt,
      decidedBy: 1, reviewHash: review.hash, schemaVersion: 1,
    }
    await expect(preparePublicationReview({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(preparePublicationReview({ data: { ...data, reviewHash: `sha256:${'b'.repeat(64)}` }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/hash|revisión/i)
  })

  it('rejects updates, deletes and anonymous creation', async () => {
    await expect(preparePublicationReview({ data: {}, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(preparePublicationReview({ data: {}, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforcePublicationReviewDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
