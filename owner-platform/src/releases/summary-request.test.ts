import { describe, expect, it, vi } from 'vitest'

import { handleReleaseSummaryRequest } from './summary-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('release summary HTTP boundary', () => {
  it('authenticates before loading the version history', async () => {
    const load = vi.fn()
    const forbidden = await handleReleaseSummaryRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()

    const response = await handleReleaseSummaryRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ count: 1, versions: [] }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ releases: { count: 1, versions: [] } })
  })
})
