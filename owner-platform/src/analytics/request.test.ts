import { describe, expect, it, vi } from 'vitest'

import { handleAnalyticsSnapshotRequest, parseAnalyticsSnapshotRequest } from './request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const data = {
  period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
  routes: [], source: 'manual-export', totals: { pageViews: 10, visitors: 8 }, vitals: {},
}
const valid = { confirmation: 'IMPORTAR ANALÍTICA', data }

describe('analytics snapshot HTTP boundary', () => {
  it('accepts only the exact import envelope', () => {
    expect(parseAnalyticsSnapshotRequest(valid)).toEqual(valid)
    expect(() => parseAnalyticsSnapshotRequest({ ...valid, token: 'secret' })).toThrow(/campo|permitido/i)
    expect(() => parseAnalyticsSnapshotRequest({ ...valid, confirmation: 'conectar' })).toThrow(/confirmación/i)
  })

  it('authenticates before parsing and bounds request bodies', async () => {
    const create = vi.fn()
    const forbidden = await handleAnalyticsSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', body: '{bad' }), { authenticate: async () => ({ user: null }), create })
    expect(forbidden.status).toBe(403)
    const oversized = await handleAnalyticsSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '262145' }, body: '{}' }), { authenticate: async () => ({ user: owner }), create })
    expect(oversized.status).toBe(413)
  })

  it('passes only validated analytics data to the service', async () => {
    const create = vi.fn(async () => ({ id: 110 }))
    const response = await handleAnalyticsSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify(valid) }), { authenticate: async () => ({ user: owner }), create })
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(valid, owner)
    expect(JSON.stringify(create.mock.calls)).not.toMatch(/apiKey|deploy|publish/)
  })
})
