import { describe, expect, it, vi } from 'vitest'

import { handleRecentContentRequest } from './recent-content-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('recent content HTTP boundary', () => {
  it('authenticates before loading editorial metadata', async () => {
    const load = vi.fn()
    const forbidden = await handleRecentContentRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleRecentContentRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ projects: [] }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ recent: { projects: [] } })
  })
})
