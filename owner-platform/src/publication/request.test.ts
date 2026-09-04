import { describe, expect, it, vi } from 'vitest'

import { handlePublicationBundleRequest, parsePublicationBundleRequest } from './request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const valid = { confirmation: 'PREPARAR PUBLICACIÓN', name: 'Publicación septiembre', releaseIds: [44, 45] }

describe('publication bundle HTTP boundary', () => {
  it('accepts only an ordered release selection, name and exact preparation phrase', () => {
    expect(parsePublicationBundleRequest(valid)).toEqual(valid)
    expect(() => parsePublicationBundleRequest({ ...valid, deploy: true })).toThrow(/campo|permitido/i)
    expect(() => parsePublicationBundleRequest({ ...valid, confirmation: 'publicar' })).toThrow(/confirmación/i)
  })

  it('authenticates before parsing and bounds request bodies', async () => {
    const create = vi.fn()
    const forbidden = await handlePublicationBundleRequest(
      new Request('https://owner.test/api', { method: 'POST', body: '{bad' }),
      { authenticate: async () => ({ user: null }), create },
    )
    expect(forbidden.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
    const oversized = await handlePublicationBundleRequest(
      new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '16385' }, body: '{}' }),
      { authenticate: async () => ({ user: owner }), create },
    )
    expect(oversized.status).toBe(413)
  })

  it('passes validated selection to the service without publish or deploy controls', async () => {
    const create = vi.fn(async () => ({ id: 80 }))
    const response = await handlePublicationBundleRequest(
      new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify(valid) }),
      { authenticate: async () => ({ user: owner }), create },
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(valid, owner)
    expect(JSON.stringify(create.mock.calls)).not.toMatch(/deploy|apply/)
  })
})
