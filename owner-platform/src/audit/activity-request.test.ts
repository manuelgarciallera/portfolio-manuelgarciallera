import { describe, expect, it, vi } from 'vitest'

import { handleAuditActivityRequest } from './activity-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('audit activity HTTP boundary', () => {
  it('authenticates before loading recent activity', async () => {
    const load = vi.fn()
    const forbidden = await handleAuditActivityRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleAuditActivityRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ count: 0, events: [] }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ activity: { count: 0, events: [] } })
  })
})
