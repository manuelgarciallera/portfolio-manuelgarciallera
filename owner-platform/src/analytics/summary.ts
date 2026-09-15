import { hashAnalyticsSnapshot, type AnalyticsSnapshot } from './snapshot'

type Rating = 'good' | 'needs-improvement' | 'poor'
const change = (current: number, previous?: number): number | null => {
  if (previous === undefined || previous === 0) return null
  return Math.round(((current - previous) / previous) * 10_000) / 100
}
const rate = (value: number, good: number, poor: number): Rating => value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor'

export const buildAnalyticsSummary = (current: AnalyticsSnapshot, previous?: AnalyticsSnapshot) => {
  hashAnalyticsSnapshot(current)
  if (previous) hashAnalyticsSnapshot(previous)
  // Compare adjacent, equally long UTC windows only; rolling exports can overlap.
  const currentFrom = Date.parse(current.period.from)
  const currentDuration = Date.parse(current.period.to) - currentFrom
  const baseline = previous?.source === current.source
    && Date.parse(previous.period.to) === currentFrom
    && Date.parse(previous.period.to) - Date.parse(previous.period.from) === currentDuration
    ? previous : undefined
  const vital = <K extends keyof AnalyticsSnapshot['vitals']>(key: K, good: number, poor: number) => {
    const value = current.vitals[key]
    return value === undefined ? null : { rating: rate(value, good, poor), value }
  }
  return Object.freeze({
    engagement: {
      averageDurationSeconds: current.totals.averageDurationSeconds ?? null,
      bounceRatePercent: current.totals.bounceRatePercent ?? null,
    },
    period: current.period,
    previousPeriod: baseline?.period ?? null,
    source: current.source,
    topRoutes: [...current.routes].sort((a, b) => b.pageViews - a.pageViews || a.path.localeCompare(b.path)).slice(0, 10),
    traffic: {
      pageViews: current.totals.pageViews,
      pageViewsChangePercent: change(current.totals.pageViews, baseline?.totals.pageViews),
      visitors: current.totals.visitors,
      visitorsChangePercent: change(current.totals.visitors, baseline?.totals.visitors),
    },
    vitals: {
      cls: vital('cls', 0.1, 0.25),
      inp: vital('inpMilliseconds', 200, 500),
      lcp: vital('lcpMilliseconds', 2500, 4000),
    },
  })
}
