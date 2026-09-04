import { describe, expect, it } from 'vitest'

import { buildReleaseSummary } from './summary'

const release = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  name: 'Checkpoint editorial',
  changeSummary: 'Canvas modular y SEO.',
  gitCommit: 'a'.repeat(40),
  createdAt: '2026-09-05T08:00:00.000Z',
  previewSnapshot: 11,
  draftSnapshot: 12,
  quality: [
    { viewport: 'desktop', performance: 96, usability: 94, accessibility: 98, source: 'lighthouse', measuredAt: '2026-09-05T07:50:00.000Z' },
    { viewport: 'mobile', performance: 88, usability: 92, accessibility: 96, source: 'lighthouse', measuredAt: '2026-09-05T07:55:00.000Z' },
  ],
  ...overrides,
})

describe('buildReleaseSummary', () => {
  it('returns dashboard-safe versions with comparable scores and restore provenance', () => {
    const summary = buildReleaseSummary([release()])
    expect(summary).toEqual({
      count: 1,
      versions: [{
        id: 7,
        name: 'Checkpoint editorial',
        changeSummary: 'Canvas modular y SEO.',
        gitCommit: 'a'.repeat(40),
        createdAt: '2026-09-05T08:00:00.000Z',
        previewSnapshotId: 11,
        draftSnapshotId: 12,
        scores: {
          average: { accessibility: 97, performance: 92, usability: 93 },
          desktop: { accessibility: 98, performance: 96, usability: 94 },
          mobile: { accessibility: 96, performance: 88, usability: 92 },
        },
      }],
    })
  })

  it('rejects malformed release records instead of presenting unreliable history', () => {
    expect(() => buildReleaseSummary([release({ gitCommit: 'short' })])).toThrow(/commit/i)
    expect(() => buildReleaseSummary([release({ quality: [] })])).toThrow(/calidad/i)
  })
})
