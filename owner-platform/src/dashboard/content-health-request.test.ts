import { describe, expect, it, vi } from 'vitest'

import { handleContentHealthRequest } from './content-health-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('content health HTTP boundary', () => {
  it('authenticates before loading and returns only the summary', async () => {
    const load = vi.fn()
    const forbidden = await handleContentHealthRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleContentHealthRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ issueCount: 2 }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ health: { issueCount: 2 } })
  })
})
