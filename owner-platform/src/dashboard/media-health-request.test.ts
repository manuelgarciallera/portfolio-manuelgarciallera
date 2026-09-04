import { describe, expect, it, vi } from 'vitest'

import { handleMediaHealthRequest } from './media-health-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('media health HTTP boundary', () => {
  it('authenticates before loading the inventory', async () => {
    const load = vi.fn()
    const forbidden = await handleMediaHealthRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleMediaHealthRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ issueCount: 1 }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ media: { issueCount: 1 } })
  })
})
