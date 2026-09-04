import { describe, expect, it } from 'vitest'

import { createPublicationReview, hashPublicationReview } from './review'

const input = {
  bundleHash: `sha256:${'a'.repeat(64)}`,
  bundleId: 80,
  decision: 'approved' as const,
  decidedAt: '2026-09-04T22:00:00.000Z',
  decidedBy: 1,
  note: 'Revisado antes de conectar cualquier publicación.',
}

describe('publication review', () => {
  it('creates a canonical, hash-verifiable immutable decision', () => {
    const first = createPublicationReview(input)
    const second = createPublicationReview({ ...input, note: `  ${input.note}  ` })
    expect(first).toEqual(second)
    expect(first.schemaVersion).toBe(1)
    expect(hashPublicationReview(first)).toBe(first.hash)
  })

  it('rejects unknown controls and malformed provenance', () => {
    expect(() => createPublicationReview({ ...input, deploy: true })).toThrow(/campo|permitido/i)
    expect(() => createPublicationReview({ ...input, bundleHash: 'bad' })).toThrow(/hash/i)
    expect(() => createPublicationReview({ ...input, decision: 'published' })).toThrow(/decisión/i)
  })
})
