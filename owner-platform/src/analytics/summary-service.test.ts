import { describe, expect, it, vi } from 'vitest'

import { createAnalyticsSnapshot } from './snapshot'
import { getOwnerAnalyticsSummary } from './summary-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const snapshot = createAnalyticsSnapshot({ capturedAt: '2026-09-05T00:00:00.000Z', period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' }, routes: [], source: 'manual-export', totals: { pageViews: 10, visitors: 8 }, vitals: {} })

describe('getOwnerAnalyticsSummary', () => {
  it('loads only the latest two owner-visible snapshots and verifies storage hashes', async () => {
    const find = vi.fn(async () => ({ docs: [{ snapshot, snapshotHash: snapshot.hash }] }))
    const result = await getOwnerAnalyticsSummary({ payload: { find }, req: { user: owner } })
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'analytics-snapshots', limit: 2, overrideAccess: false, sort: '-periodTo' }))
    expect(result.traffic).toMatchObject({ pageViews: 10, visitors: 8 })
  })

  it('rejects anonymous access, no data and mismatched stored hashes', async () => {
    await expect(getOwnerAnalyticsSummary({ payload: {} as never, req: { user: null } })).rejects.toThrow(/owner/i)
    await expect(getOwnerAnalyticsSummary({ payload: { find: vi.fn(async () => ({ docs: [] })) }, req: { user: owner } })).rejects.toThrow(/disponible/i)
    await expect(getOwnerAnalyticsSummary({ payload: { find: vi.fn(async () => ({ docs: [{ snapshot, snapshotHash: `sha256:${'a'.repeat(64)}` }] })) }, req: { user: owner } })).rejects.toThrow(/integridad|hash/i)
  })
})
