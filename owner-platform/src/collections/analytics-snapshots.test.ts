import { describe, expect, it } from 'vitest'

import { createAnalyticsSnapshot } from '../analytics/snapshot'
import { AnalyticsSnapshots, enforceAnalyticsSnapshotDelete, prepareAnalyticsSnapshot } from './AnalyticsSnapshots'

const owner = { id: 1, collection: 'users', role: 'owner' }
const snapshot = createAnalyticsSnapshot({ capturedAt: '2026-09-05T00:00:00.000Z', period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' }, routes: [], source: 'manual-export', totals: { pageViews: 10, visitors: 8 }, vitals: {} })

describe('AnalyticsSnapshots collection', () => {
  it('is immutable, owner-readable and closed to direct client mutation', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(AnalyticsSnapshots.slug).toBe('analytics-snapshots')
    expect(AnalyticsSnapshots.access?.read?.(access(owner))).toBe(true)
    expect(AnalyticsSnapshots.access?.read?.(access(null))).toBe(false)
    expect(AnalyticsSnapshots.access?.create?.(access(owner))).toBe(false)
    expect(AnalyticsSnapshots.access?.update?.(access(owner))).toBe(false)
    expect(AnalyticsSnapshots.access?.delete?.(access(owner))).toBe(false)
  })

  it('accepts only matching canonical data and owner provenance', async () => {
    const data = { capturedAt: snapshot.capturedAt, createdBy: 1, periodFrom: snapshot.period.from, periodTo: snapshot.period.to, routeCount: 0, schemaVersion: 1, snapshot, snapshotHash: snapshot.hash, source: snapshot.source }
    await expect(prepareAnalyticsSnapshot({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(prepareAnalyticsSnapshot({ data: { ...data, routeCount: 1 }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/snapshot|rutas/i)
  })

  it('rejects updates, deletes and anonymous creation', async () => {
    await expect(prepareAnalyticsSnapshot({ data: {}, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(prepareAnalyticsSnapshot({ data: {}, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforceAnalyticsSnapshotDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
