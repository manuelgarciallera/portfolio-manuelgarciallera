import { describe, expect, it, vi } from 'vitest'

import { handleFigmaImportReviewRequest, parseFigmaImportReviewRequest } from './import-review-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('Figma import review request', () => {
  it('requires the decision-specific phrase and rejects extra authority', () => {
    expect(parseFigmaImportReviewRequest({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', note: ' Revisado. ' })).toEqual({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', note: 'Revisado.' })
    expect(() => parseFigmaImportReviewRequest({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'rejected' })).toThrow(/confirmación/i)
    expect(() => parseFigmaImportReviewRequest({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', download: true })).toThrow(/campo/i)
  })

  it('authenticates before invoking the review service', async () => {
    const review = vi.fn(async () => ({ id: 50, decision: 'approved' }))
    const request = new Request('http://owner.test', { method: 'POST', body: JSON.stringify({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved' }) })
    const denied = await handleFigmaImportReviewRequest(request.clone(), 44, { authenticate: async () => ({ user: null }), review })
    expect(denied.status).toBe(403)
    expect(review).not.toHaveBeenCalled()
    const response = await handleFigmaImportReviewRequest(request, 44, { authenticate: async () => ({ user: owner }), review })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ review: { id: 50, decision: 'approved' } })
  })
})
