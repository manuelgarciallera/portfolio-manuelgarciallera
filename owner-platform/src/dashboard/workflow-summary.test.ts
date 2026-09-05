import { describe, expect, it } from 'vitest'

import { buildWorkflowSummary } from './workflow-summary'

describe('buildWorkflowSummary', () => {
  it('derives a bounded owner attention queue from workflow counts', () => {
    expect(buildWorkflowSummary({
      artifacts: 2,
      bundles: 5,
      figmaImportExecutions: 1,
      figmaImportPlans: 3,
      figmaImportReviews: { approved: 2, rejected: 0 },
      preflights: { blocked: 1, ready: 0, ready_with_warnings: 0 },
      proposals: { accepted: 4, pending: 3, rejected: 1 },
      restores: { confirmed: 1, conflict: 2, executed: 6, ready: 2 },
      reviews: { approved: 3, rejected: 1 },
    })).toEqual({
      attentionCount: 14,
      figmaImport: { approvedAwaitingImport: 1, awaitingReview: 1, executions: 1, plans: 3, reviews: { approved: 2, rejected: 0, total: 2 } },
      proposals: { accepted: 4, pending: 3, rejected: 1, total: 8 },
      publication: { approvedAwaitingArtifact: 1, artifacts: 2, awaitingPreflight: 1, awaitingReview: 1, bundles: 5, preflights: { blocked: 1, ready: 0, ready_with_warnings: 0, total: 1 }, reviews: { approved: 3, rejected: 1, total: 4 } },
      restores: { confirmed: 1, conflict: 2, executed: 6, ready: 2, total: 11 },
    })
  })

  it('rejects impossible workflow totals', () => {
    const input = { artifacts: 2, bundles: 1, figmaImportExecutions: 0, figmaImportPlans: 0, figmaImportReviews: { approved: 0, rejected: 0 }, preflights: { blocked: 0, ready: 0, ready_with_warnings: 0 }, proposals: { accepted: 0, pending: 0, rejected: 0 }, restores: { confirmed: 0, conflict: 0, executed: 0, ready: 0 }, reviews: { approved: 1, rejected: 1 } }
    expect(() => buildWorkflowSummary(input)).toThrow(/revisiones/i)
    expect(() => buildWorkflowSummary({ ...input, bundles: 2, artifacts: 3 })).toThrow(/artefactos/i)
    expect(() => buildWorkflowSummary({ ...input, artifacts: 0, bundles: 2, figmaImportPlans: 0, figmaImportReviews: { approved: 1, rejected: 0 }, reviews: { approved: 0, rejected: 0 } })).toThrow(/figma/i)
    expect(() => buildWorkflowSummary({ ...input, artifacts: 0, bundles: 2, figmaImportExecutions: 1, figmaImportPlans: 1, figmaImportReviews: { approved: 0, rejected: 1 }, reviews: { approved: 0, rejected: 0 } })).toThrow(/figma/i)
    expect(() => buildWorkflowSummary({ ...input, artifacts: 1, bundles: 2, preflights: { blocked: 1, ready: 1, ready_with_warnings: 0 }, reviews: { approved: 1, rejected: 0 } })).toThrow(/preflight/i)
  })
})
