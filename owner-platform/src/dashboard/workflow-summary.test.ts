import { describe, expect, it } from 'vitest'

import { buildWorkflowSummary } from './workflow-summary'

describe('buildWorkflowSummary', () => {
  it('derives a bounded owner attention queue from workflow counts', () => {
    expect(buildWorkflowSummary({
      artifacts: 2,
      bundles: 5,
      figmaImportPlans: 2,
      figmaImportReviews: 1,
      proposals: { accepted: 4, pending: 3, rejected: 1 },
      restores: { confirmed: 1, conflict: 2, executed: 6, ready: 2 },
      reviews: { approved: 3, rejected: 1 },
    })).toEqual({
      attentionCount: 11,
      figmaImport: { awaitingReview: 1, plans: 2, reviews: 1 },
      proposals: { accepted: 4, pending: 3, rejected: 1, total: 8 },
      publication: { approvedAwaitingArtifact: 1, artifacts: 2, awaitingReview: 1, bundles: 5, reviews: { approved: 3, rejected: 1, total: 4 } },
      restores: { confirmed: 1, conflict: 2, executed: 6, ready: 2, total: 11 },
    })
  })

  it('rejects impossible workflow totals', () => {
    const input = { artifacts: 2, bundles: 1, figmaImportPlans: 0, figmaImportReviews: 0, proposals: { accepted: 0, pending: 0, rejected: 0 }, restores: { confirmed: 0, conflict: 0, executed: 0, ready: 0 }, reviews: { approved: 1, rejected: 1 } }
    expect(() => buildWorkflowSummary(input)).toThrow(/revisiones/i)
    expect(() => buildWorkflowSummary({ ...input, bundles: 2, artifacts: 3 })).toThrow(/artefactos/i)
    expect(() => buildWorkflowSummary({ ...input, artifacts: 0, bundles: 2, figmaImportPlans: 0, figmaImportReviews: 1, reviews: { approved: 0, rejected: 0 } })).toThrow(/figma/i)
  })
})
