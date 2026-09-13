import { describe, expect, it, vi } from 'vitest'
import { APIError } from 'payload'

import { handleReadinessRequest } from './readiness-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('readiness HTTP boundary', () => {
  it.each([
    { name: 'owner success', user: owner, failure: null, status: 200 },
    { name: 'anonymous denial', user: null, failure: null, status: 403 },
    { name: 'client error', user: owner, failure: new APIError('private-runtime-detail', 409), status: 409 },
    { name: 'server error', user: owner, failure: new APIError('private-runtime-detail', 503), status: 500 },
    { name: 'unexpected error', user: owner, failure: new Error('private-runtime-detail'), status: 500 },
  ])('does not cache private readiness responses: $name', async ({ user, failure, status }) => {
    const response = await handleReadinessRequest(new Request('https://owner.test/api'), {
      authenticate: async () => ({ user }),
      load: async () => { if (failure) throw failure; return { productionReady: false } },
    })
    expect(response.status).toBe(status)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).not.toContain('private-runtime-detail')
  })
  it('authenticates before reading runtime readiness', async () => {
    const load = vi.fn()
    const forbidden = await handleReadinessRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleReadinessRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ productionReady: false }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ readiness: { productionReady: false } })
  })
})
