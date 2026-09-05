import { describe, expect, it, vi } from 'vitest'

import { handlePublicationPreflightRequest, parsePublicationPreflightRequest } from './preflight-request'

const owner = { collection: 'users', id: 1, role: 'owner' }
const request = (body: unknown) => new Request('http://owner.test', { body: JSON.stringify(body), method: 'POST' })

describe('publication preflight HTTP boundary', () => {
  it('accepts only the exact non-publishing confirmation', () => {
    expect(parsePublicationPreflightRequest({ confirmation: 'VALIDAR ARTEFACTO' })).toEqual({ confirmation: 'VALIDAR ARTEFACTO' })
    expect(() => parsePublicationPreflightRequest({ confirmation: 'publicar' })).toThrow(/VALIDAR ARTEFACTO/)
    expect(() => parsePublicationPreflightRequest({ confirmation: 'VALIDAR ARTEFACTO', publish: true })).toThrow(/campo no permitido/i)
  })

  it('authenticates before creating and returns a bounded admin destination', async () => {
    const create = vi.fn(async () => ({ id: 110, issueCount: 2, status: 'ready_with_warnings' }))
    const denied = await handlePublicationPreflightRequest(request({ confirmation: 'VALIDAR ARTEFACTO' }), 100, { authenticate: async () => ({ user: null }), create })
    expect(denied.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
    const response = await handlePublicationPreflightRequest(request({ confirmation: 'VALIDAR ARTEFACTO' }), 100, { authenticate: async () => ({ user: owner }), create })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ preflight: { href: '/admin/collections/publication-preflights/110', issueCount: 2, status: 'ready_with_warnings' } })
    expect(create).toHaveBeenCalledWith(100, owner)
  })

  it('rejects unsafe IDs, malformed bodies, and unsafe service responses with controlled errors', async () => {
    const create = vi.fn(async () => ({ id: '../users', issueCount: 0, status: 'ready' }))
    const dependencies = { authenticate: async () => ({ user: owner }), create }
    expect((await handlePublicationPreflightRequest(request({ confirmation: 'VALIDAR ARTEFACTO' }), '../users', dependencies)).status).toBe(400)
    expect((await handlePublicationPreflightRequest(new Request('http://owner.test', { body: '{', method: 'POST' }), 100, dependencies)).status).toBe(400)
    expect((await handlePublicationPreflightRequest(request({ confirmation: 'VALIDAR ARTEFACTO' }), 100, dependencies)).status).toBe(500)
  })
})
