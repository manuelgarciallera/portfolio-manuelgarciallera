import { describe, expect, it } from 'vitest'

import { createFigmaImportReview } from '../connectors/figma/import-review'
import { enforceFigmaImportReviewDelete, FigmaImportReviews, prepareFigmaImportReview } from './FigmaImportReviews'

const owner = { id: 1, collection: 'users', role: 'owner' }
const review = createFigmaImportReview({ decidedAt: '2026-09-05T06:00:00.000Z', decidedBy: 1, decision: 'approved', planHash: `sha256:${'a'.repeat(64)}`, planId: 44 })
const data = { decidedAt: review.decidedAt, decidedBy: 1, decision: review.decision, plan: 44, planHash: review.planHash, reviewHash: review.hash, schemaVersion: 1 }

describe('FigmaImportReviews collection', () => {
  it('is immutable, owner-readable, and closed to direct mutation', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(FigmaImportReviews.slug).toBe('figma-import-reviews')
    expect(FigmaImportReviews.access?.read?.(access(owner))).toBe(true)
    expect(FigmaImportReviews.access?.read?.(access(null))).toBe(false)
    expect(FigmaImportReviews.access?.create?.(access(owner))).toBe(false)
    expect(FigmaImportReviews.access?.update?.(access(owner))).toBe(false)
    expect(FigmaImportReviews.access?.delete?.(access(owner))).toBe(false)
  })

  it('accepts only matching canonical owner provenance', async () => {
    await expect(prepareFigmaImportReview({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(prepareFigmaImportReview({ data: { ...data, reviewHash: `sha256:${'b'.repeat(64)}` }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/hash|revisión/i)
  })

  it('rejects updates, deletes, and anonymous creation', async () => {
    await expect(prepareFigmaImportReview({ data, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(prepareFigmaImportReview({ data, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforceFigmaImportReviewDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
