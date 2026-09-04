import { describe, expect, it } from 'vitest'

import { createAnalyticsSnapshot, hashAnalyticsSnapshot } from './snapshot'

const input = {
  capturedAt: '2026-09-05T00:00:00.000Z',
  period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
  routes: [{ path: '/', pageViews: 900, visitors: 500 }, { path: '/casos', pageViews: 400, visitors: 300 }],
  source: 'manual-export',
  totals: { averageDurationSeconds: 94.2, bounceRatePercent: 37.4, pageViews: 1300, visitors: 800 },
  vitals: { cls: 0.04, inpMilliseconds: 120, lcpMilliseconds: 1850 },
}

describe('analytics snapshot', () => {
  it('creates a deterministic immutable and verifiable provider-neutral snapshot', () => {
    const first = createAnalyticsSnapshot(input)
    expect(createAnalyticsSnapshot(input)).toEqual(first)
    expect(first.schemaVersion).toBe(1)
    expect(hashAnalyticsSnapshot(first)).toBe(first.hash)
    expect(Object.isFrozen(first.routes)).toBe(true)
  })

  it('rejects secrets, execution controls, duplicate routes and invalid metrics', () => {
    expect(() => createAnalyticsSnapshot({ ...input, apiKey: 'secret' })).toThrow(/campo|permitido/i)
    expect(() => createAnalyticsSnapshot({ ...input, deploy: true })).toThrow(/campo|permitido/i)
    expect(() => createAnalyticsSnapshot({ ...input, routes: [...input.routes, input.routes[0]] })).toThrow(/duplicada/i)
    expect(() => createAnalyticsSnapshot({ ...input, totals: { ...input.totals, bounceRatePercent: 101 } })).toThrow(/rebote|porcentaje/i)
    expect(() => createAnalyticsSnapshot({ ...input, period: { from: input.period.to, to: input.period.from } })).toThrow(/periodo/i)
  })
})
