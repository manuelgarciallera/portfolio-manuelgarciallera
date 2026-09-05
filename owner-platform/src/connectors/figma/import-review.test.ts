import { describe, expect, it } from 'vitest'

import { createFigmaImportReview, hashFigmaImportReview } from './import-review'

const input = { decidedAt: '2026-09-05T06:00:00.000Z', decidedBy: 1, decision: 'approved' as const, note: 'Nodo y encuadre revisados.', planHash: `sha256:${'a'.repeat(64)}`, planId: 44 }

describe('Figma import review', () => {
  it('creates a canonical immutable and hash-verifiable owner decision', () => {
    const review = createFigmaImportReview(input)
    expect(review).toEqual(createFigmaImportReview({ ...input, note: `  ${input.note}  ` }))
    expect(review.schemaVersion).toBe(1)
    expect(hashFigmaImportReview(review)).toBe(review.hash)
    expect(Object.isFrozen(review)).toBe(true)
  })

  it('rejects unknown authority, malformed provenance, and invalid decisions', () => {
    expect(() => createFigmaImportReview({ ...input, download: true })).toThrow(/campo|permitido/i)
    expect(() => createFigmaImportReview({ ...input, planHash: 'bad' })).toThrow(/hash/i)
    expect(() => createFigmaImportReview({ ...input, decision: 'imported' })).toThrow(/decisión/i)
    expect(() => createFigmaImportReview({ ...input, note: 'x'.repeat(1001) })).toThrow(/nota/i)
  })
})
