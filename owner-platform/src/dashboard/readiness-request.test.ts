import { describe, expect, it, vi } from 'vitest'

import { handleReadinessRequest } from './readiness-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('readiness HTTP boundary', () => {
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
