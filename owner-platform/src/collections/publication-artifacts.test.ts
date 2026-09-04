import { describe, expect, it } from 'vitest'

import { createPublicationArtifact } from '../publication/artifact'
import { enforcePublicationArtifactDelete, preparePublicationArtifact, PublicationArtifacts } from './PublicationArtifacts'

const owner = { id: 1, collection: 'users', role: 'owner' }
const artifact = createPublicationArtifact({ bundleHash: `sha256:${'a'.repeat(64)}`, bundleId: 80, pageCount: 1, reviewHash: `sha256:${'b'.repeat(64)}`, reviewId: 90 })

describe('PublicationArtifacts collection', () => {
  it('is immutable, owner-readable and closed to direct client mutation', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(PublicationArtifacts.slug).toBe('publication-artifacts')
    expect(PublicationArtifacts.access?.read?.(access(owner))).toBe(true)
    expect(PublicationArtifacts.access?.read?.(access(null))).toBe(false)
    expect(PublicationArtifacts.access?.create?.(access(owner))).toBe(false)
    expect(PublicationArtifacts.access?.update?.(access(owner))).toBe(false)
    expect(PublicationArtifacts.access?.delete?.(access(owner))).toBe(false)
  })

  it('accepts only matching canonical data and owner provenance', async () => {
    const data = { artifact, artifactHash: artifact.hash, bundle: 80, bundleHash: artifact.bundleHash, createdBy: 1, pageCount: 1, review: 90, reviewHash: artifact.reviewHash, schemaVersion: 1 }
    await expect(preparePublicationArtifact({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(preparePublicationArtifact({ data: { ...data, pageCount: 2 }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/artefacto|páginas/i)
  })

  it('rejects updates, deletes and anonymous creation', async () => {
    await expect(preparePublicationArtifact({ data: {}, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(preparePublicationArtifact({ data: {}, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforcePublicationArtifactDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
