import { describe, expect, it, vi } from 'vitest'

import { handlePublicationReviewRequest, parsePublicationReviewRequest } from './review-request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const valid = {
  confirmation: 'APROBAR PAQUETE',
  decision: 'approved' as const,
  note: 'Revisión owner completada.',
}

describe('publication review HTTP boundary', () => {
  it('requires an exact decision phrase and rejects execution controls', () => {
    expect(parsePublicationReviewRequest(valid)).toEqual(valid)
    expect(() => parsePublicationReviewRequest({ ...valid, deploy: true })).toThrow(/campo|permitido/i)
    expect(() => parsePublicationReviewRequest({ ...valid, confirmation: 'publicar' })).toThrow(/confirmación/i)
    expect(parsePublicationReviewRequest({ confirmation: 'RECHAZAR PAQUETE', decision: 'rejected' })).toEqual({
      confirmation: 'RECHAZAR PAQUETE', decision: 'rejected',
    })
  })

  it('authenticates before parsing and never exposes publish controls', async () => {
    const review = vi.fn()
    const forbidden = await handlePublicationReviewRequest(
      new Request('https://owner.test/api', { method: 'POST', body: '{bad' }), 80,
      { authenticate: async () => ({ user: null }), review },
    )
    expect(forbidden.status).toBe(403)
    const response = await handlePublicationReviewRequest(
      new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify(valid) }), 80,
      { authenticate: async () => ({ user: owner }), review: async (input, user) => ({ ...input, user }) },
    )
    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ review: { bundleId: 80, decision: 'approved' } })
  })
})
