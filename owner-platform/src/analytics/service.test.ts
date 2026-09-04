import { describe, expect, it, vi } from 'vitest'

import { createOwnerAnalyticsSnapshot } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const data = {
  period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
  routes: [], source: 'manual-export', totals: { pageViews: 10, visitors: 8 }, vitals: {},
}

describe('createOwnerAnalyticsSnapshot', () => {
  it('creates an immutable owner-attributed snapshot and audits it', async () => {
    const create = vi.fn(async ({ collection, data: stored }) => collection === 'analytics-snapshots' ? { id: 110, ...stored } : { id: 111, ...stored })
    const result = await createOwnerAnalyticsSnapshot({ confirmation: 'IMPORTAR ANALÍTICA', data, now: '2026-09-05T00:00:00.000Z', payload: { create }, req: { user: owner } })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'analytics-snapshots', data: expect.objectContaining({ createdBy: 1, routeCount: 0, source: 'manual-export', snapshot: expect.objectContaining({ capturedAt: '2026-09-05T00:00:00.000Z' }) }) }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'analytics.snapshot.created', subjectId: '110' }) }))
    expect(result).toMatchObject({ id: 110, source: 'manual-export' })
  })

  it('rejects anonymous access and an incorrect confirmation', async () => {
    await expect(createOwnerAnalyticsSnapshot({ confirmation: 'IMPORTAR ANALÍTICA', data, payload: {} as never, req: { user: null } })).rejects.toThrow(/owner/i)
    await expect(createOwnerAnalyticsSnapshot({ confirmation: 'conectar', data, payload: { create: vi.fn() }, req: { user: owner } })).rejects.toThrow(/confirmación/i)
  })
})
