import { describe, expect, it, vi } from 'vitest'

import { handleAnalyticsSummaryRequest } from './summary-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('analytics summary HTTP boundary', () => {
  it('authenticates before loading and returns dashboard-safe data', async () => {
    const load = vi.fn()
    const forbidden = await handleAnalyticsSummaryRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleAnalyticsSummaryRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ traffic: { pageViews: 10 } }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ summary: { traffic: { pageViews: 10 } } })
  })
})
