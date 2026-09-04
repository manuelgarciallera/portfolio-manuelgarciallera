import { describe, expect, it, vi } from 'vitest'

import { handleDashboardOverviewRequest } from './overview-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('dashboard overview HTTP boundary', () => {
  it('authenticates before loading and returns a bounded overview', async () => {
    const load = vi.fn()
    const forbidden = await handleDashboardOverviewRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleDashboardOverviewRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ analytics: { available: false } }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ overview: { analytics: { available: false } } })
  })
})
