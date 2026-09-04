import { describe, expect, it } from 'vitest'

import { createAnalyticsSnapshot } from './snapshot'
import { buildAnalyticsSummary } from './summary'

const make = (pageViews: number, visitors: number, suffix: string) => createAnalyticsSnapshot({
  capturedAt: `2026-09-0${suffix}T00:00:00.000Z`,
  period: { from: `2026-08-0${suffix}T00:00:00.000Z`, to: `2026-09-0${suffix}T00:00:00.000Z` },
  routes: [{ path: '/casos', pageViews: pageViews - 10, visitors: visitors - 5 }, { path: '/', pageViews: 10, visitors: 5 }],
  source: 'manual-export', totals: { pageViews, visitors }, vitals: { cls: 0.12, inpMilliseconds: 180, lcpMilliseconds: 2800 },
})

describe('analytics dashboard summary', () => {
  it('compares verified periods, ranks routes and rates web vitals', () => {
    const summary = buildAnalyticsSummary(make(120, 60, '2'), make(100, 50, '1'))
    expect(summary.traffic).toEqual({ pageViews: 120, pageViewsChangePercent: 20, visitors: 60, visitorsChangePercent: 20 })
    expect(summary.topRoutes[0]).toMatchObject({ path: '/casos', pageViews: 110 })
    expect(summary.vitals).toEqual({ cls: { rating: 'needs-improvement', value: 0.12 }, inp: { rating: 'good', value: 180 }, lcp: { rating: 'needs-improvement', value: 2800 } })
  })

  it('returns null comparisons without a previous period and rejects tampering', () => {
    const current = make(120, 60, '2')
    expect(buildAnalyticsSummary(current).traffic.pageViewsChangePercent).toBeNull()
    expect(() => buildAnalyticsSummary({ ...current, totals: { ...current.totals, pageViews: 999 } })).toThrow(/hash/i)
  })
})
