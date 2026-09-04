import { describe, expect, it, vi } from 'vitest'

import { handlePublicationArtifactRequest, parsePublicationArtifactRequest } from './artifact-request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const valid = { confirmation: 'GENERAR ARTEFACTO' }

describe('publication artifact HTTP boundary', () => {
  it('accepts only the exact generation phrase', () => {
    expect(parsePublicationArtifactRequest(valid)).toEqual(valid)
    expect(() => parsePublicationArtifactRequest({ ...valid, publish: true })).toThrow(/campo|permitido/i)
    expect(() => parsePublicationArtifactRequest({ confirmation: 'publicar' })).toThrow(/confirmación/i)
  })

  it('authenticates before parsing and returns an isolated artifact', async () => {
    const generate = vi.fn()
    const forbidden = await handlePublicationArtifactRequest(
      new Request('https://owner.test/api', { method: 'POST', body: '{bad' }), 90,
      { authenticate: async () => ({ user: null }), generate },
    )
    expect(forbidden.status).toBe(403)
    const response = await handlePublicationArtifactRequest(
      new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify(valid) }), 90,
      { authenticate: async () => ({ user: owner }), generate: async (input, user) => ({ ...input, user }) },
    )
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body).toMatchObject({ artifact: { reviewId: 90 } })
    expect(JSON.stringify(body)).not.toMatch(/deploy|publish/)
  })
})
