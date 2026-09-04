import { describe, expect, it } from 'vitest'

import { buildMediaHealth } from './media-health'

describe('buildMediaHealth', () => {
  it('builds a stable inventory with actionable media issue counts', () => {
    expect(buildMediaHealth({
      assets: { drafts: 2, published: 8, total: 10 },
      issues: { assetsMissingAlt: 1, assetsMissingDimensions: 2, assetsMissingMimeType: 0, assetsOverFiveMegabytes: 3, placementsMissingAsset: 1 },
      placements: { drafts: 1, published: 4, total: 5 },
    })).toEqual({
      assets: { drafts: 2, published: 8, total: 10 },
      issueCount: 7,
      issues: { assetsMissingAlt: 1, assetsMissingDimensions: 2, assetsMissingMimeType: 0, assetsOverFiveMegabytes: 3, placementsMissingAsset: 1 },
      placements: { drafts: 1, published: 4, total: 5 },
    })
  })

  it('rejects inconsistent inventory and issue totals', () => {
    const valid = { assets: { drafts: 1, published: 1, total: 2 }, issues: { assetsMissingAlt: 0, assetsMissingDimensions: 0, assetsMissingMimeType: 0, assetsOverFiveMegabytes: 0, placementsMissingAsset: 0 }, placements: { drafts: 0, published: 1, total: 1 } }
    expect(() => buildMediaHealth({ ...valid, assets: { drafts: 2, published: 1, total: 2 } })).toThrow(/total/i)
    expect(() => buildMediaHealth({ ...valid, issues: { ...valid.issues, placementsMissingAsset: 2 } })).toThrow(/incidencias/i)
  })
})
