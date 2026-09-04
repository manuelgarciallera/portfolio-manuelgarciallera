import { describe, expect, it, vi } from 'vitest'

import { handleOwnerSearchRequest } from './request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('owner search HTTP boundary', () => {
  it('authenticates before parsing or searching', async () => {
    const search = vi.fn()
    const forbidden = await handleOwnerSearchRequest(new Request('https://owner.test/api?token=secret'), { authenticate: async () => ({ user: null }), search })
    expect(forbidden.status).toBe(403)
    expect(search).not.toHaveBeenCalled()
    const response = await handleOwnerSearchRequest(new Request('https://owner.test/api?q=sistema'), { authenticate: async () => ({ user: owner }), search: async (query) => ({ count: 0, query }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ search: { count: 0, query: 'sistema' } })
  })
})
