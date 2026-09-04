import { describe, expect, it } from 'vitest'

import { normalizeReleaseQuality } from './quality'

describe('normalizeReleaseQuality', () => {
  it('preserves a bounded, comparable desktop and mobile quality record', () => {
    expect(
      normalizeReleaseQuality({
        accessibility: 96,
        measuredAt: '2026-09-04T18:30:00.000Z',
        performance: 91,
        source: 'lighthouse',
        usability: 94,
        viewport: 'mobile',
      }),
    ).toEqual({
      accessibility: 96,
      measuredAt: '2026-09-04T18:30:00.000Z',
      performance: 91,
      source: 'lighthouse',
      usability: 94,
      viewport: 'mobile',
    })
  })

  it.each([
    { performance: -1, usability: 90, accessibility: 90 },
    { performance: 101, usability: 90, accessibility: 90 },
    { performance: 90.5, usability: 90, accessibility: 90 },
    { performance: 90, usability: Number.NaN, accessibility: 90 },
    { performance: 90, usability: 90, accessibility: '100' },
  ])('rejects malformed or misleading scores %#', (scores) => {
    expect(() =>
      normalizeReleaseQuality({
        ...scores,
        measuredAt: '2026-09-04T18:30:00.000Z',
        source: 'lighthouse',
        viewport: 'desktop',
      }),
    ).toThrow(/0 y 100/i)
  })

  it.each([
    { measuredAt: 'not-a-date', source: 'lighthouse', viewport: 'desktop' },
    { measuredAt: '2026-09-04', source: 'lighthouse', viewport: 'desktop' },
    { measuredAt: '2026-09-04T18:30:00.000Z', source: 'unknown', viewport: 'desktop' },
    { measuredAt: '2026-09-04T18:30:00.000Z', source: 'lighthouse', viewport: 'watch' },
  ])('rejects quality records that cannot be compared reliably %#', (metadata) => {
    expect(() =>
      normalizeReleaseQuality({
        accessibility: 90,
        performance: 90,
        usability: 90,
        ...metadata,
      }),
    ).toThrow()
  })

  it('rejects unknown and executable fields instead of silently persisting them', () => {
    expect(() =>
      normalizeReleaseQuality({
        accessibility: 90,
        measuredAt: '2026-09-04T18:30:00.000Z',
        performance: 90,
        script: 'fetch("https://example.com")',
        source: 'lighthouse',
        usability: 90,
        viewport: 'desktop',
      }),
    ).toThrow(/campo no permitido/i)
  })

  it('accepts and preserves Payload array row identifiers without widening the schema', () => {
    expect(
      normalizeReleaseQuality({
        accessibility: 90,
        id: 'quality-mobile',
        measuredAt: '2026-09-04T18:30:00.000Z',
        performance: 90,
        source: 'manual',
        usability: 90,
        viewport: 'mobile',
      }),
    ).toMatchObject({ id: 'quality-mobile', viewport: 'mobile' })
  })
})
