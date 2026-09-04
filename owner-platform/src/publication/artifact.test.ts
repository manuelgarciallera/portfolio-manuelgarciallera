import { describe, expect, it } from 'vitest'

import { createPublicationArtifact, hashPublicationArtifact } from './artifact'

const input = {
  bundleHash: `sha256:${'a'.repeat(64)}`,
  bundleId: 80,
  pageCount: 2,
  reviewHash: `sha256:${'b'.repeat(64)}`,
  reviewId: 90,
}

describe('publication artifact', () => {
  it('creates a deterministic manifest linking an approved review to its bundle', () => {
    const artifact = createPublicationArtifact(input)
    expect(createPublicationArtifact(input)).toEqual(artifact)
    expect(artifact.schemaVersion).toBe(1)
    expect(hashPublicationArtifact(artifact)).toBe(artifact.hash)
  })

  it('rejects unknown execution fields and invalid provenance', () => {
    expect(() => createPublicationArtifact({ ...input, deploy: true })).toThrow(/campo|permitido/i)
    expect(() => createPublicationArtifact({ ...input, reviewHash: 'bad' })).toThrow(/hash/i)
    expect(() => createPublicationArtifact({ ...input, pageCount: 0 })).toThrow(/páginas/i)
  })
})
