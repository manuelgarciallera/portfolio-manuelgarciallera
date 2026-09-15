import { describe, expect, it, vi } from 'vitest'

import { handleAnalyticsSnapshotRequest } from './request'
import { createOwnerAnalyticsSnapshot } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const data = {
  period: { from: '2026-09-01T00:00:00.000Z', to: '2026-09-08T00:00:00.000Z' },
  routes: [], source: 'synthetic-qa', totals: { pageViews: 10, visitors: 8 }, vitals: {},
}

describe('analytics import request to service boundary', () => {
  it.each([
    ['secret field', { ...data, apiKey: 'synthetic-private-value' }],
    ['personal field', { ...data, email: 'synthetic@example.test' }],
    ['query string', { ...data, routes: [{ path: '/?email=synthetic', pageViews: 1, visitors: 1 }] }],
    ['invalid totals', { ...data, totals: { pageViews: -1, visitors: 8 } }],
    ['invalid period', { ...data, period: { from: data.period.to, to: data.period.from } }],
    ['duplicate routes', { ...data, routes: [{ path: '/', pageViews: 1, visitors: 1 }, { path: '/', pageViews: 2, visitors: 1 }] }],
  ])('rejects %s before any storage operation', async (_label, input) => {
    const create = vi.fn(async () => ({ id: 110 }))
    const response = await handleAnalyticsSnapshotRequest(new Request('https://owner.test/api', {
      method: 'POST', body: JSON.stringify({ confirmation: 'IMPORTAR ANALÍTICA', data: input }),
    }), {
      authenticate: async () => ({ user: owner }),
      create: (request, user) => createOwnerAnalyticsSnapshot({ ...request, payload: { create }, req: { user } }),
    })
    expect(response.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ error: 'Analytics snapshot creation failed.' })
  })

  it('stores owner provenance and records the successful import through the real service', async () => {
    const create = vi.fn(async ({ data: stored }: Record<string, unknown>) => ({ id: 110, ...(stored as Record<string, unknown>) }))
    const response = await handleAnalyticsSnapshotRequest(new Request('https://owner.test/api', {
      method: 'POST', body: JSON.stringify({ confirmation: 'IMPORTAR ANALÍTICA', data }),
    }), {
      authenticate: async () => ({ user: owner }),
      create: (request, user) => createOwnerAnalyticsSnapshot({
        ...request, now: '2026-09-15T10:00:00.000Z', payload: { create }, req: { user },
      }),
    })
    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ snapshot: { createdBy: 1, source: 'synthetic-qa', snapshot: { totals: { pageViews: 10, visitors: 8 } } } })
    expect(create).toHaveBeenCalledTimes(2)
    expect(create).toHaveBeenNthCalledWith(1, expect.objectContaining({ collection: 'analytics-snapshots', data: expect.objectContaining({ createdBy: 1 }) }))
    expect(create).toHaveBeenNthCalledWith(2, expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'analytics.snapshot.created', actor: 1, subjectId: '110' }) }))
  })
})
