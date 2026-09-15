import { describe, expect, it, vi } from 'vitest'
import { APIError } from 'payload'

import { handleAnalyticsSummaryRequest } from './summary-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('analytics summary HTTP boundary', () => {
  it.each([200, 403, 404, 409, 500])('prevents storage of the handled %s response', async (status) => {
    const response = await handleAnalyticsSummaryRequest(new Request('https://owner.test/api'), {
      authenticate: async () => ({ user: status === 403 ? null : owner }),
      load: async () => {
        if (status === 500) throw new Error('private diagnostic')
        if (status !== 200) throw new APIError('private diagnostic', status)
        return { traffic: { pageViews: 10 } }
      },
    })
    expect(response.status).toBe(status)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).not.toContain('private diagnostic')
  })
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
