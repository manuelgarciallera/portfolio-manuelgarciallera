import { describe, expect, it } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { DraftSnapshots, enforceImmutableDraftSnapshotDelete, prepareImmutableDraftSnapshot } from './DraftSnapshots'

const owner = { id: 1, collection: 'users', role: 'owner' }
const capsule = createDraftCapsule({
  source: { collection: 'pages', documentId: '7', versionId: 'current:2026-09-04T23:00:00.000Z' },
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})

describe('DraftSnapshots collection', () => {
  it('is immutable and owner-readable while direct client creation stays denied', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(DraftSnapshots.slug).toBe('draft-snapshots')
    expect(DraftSnapshots.access?.read?.(access(owner))).toBe(true)
    expect(DraftSnapshots.access?.read?.(access(null))).toBe(false)
    expect(DraftSnapshots.access?.create?.(access(owner))).toBe(false)
    expect(DraftSnapshots.access?.update?.(access(owner))).toBe(false)
    expect(DraftSnapshots.access?.delete?.(access(owner))).toBe(false)
  })

  it('accepts only matching capsule provenance and hash', async () => {
    const data = {
      capsule,
      capsuleHash: capsule.hash,
      createdBy: 1,
      schemaVersion: capsule.schemaVersion,
      sourceDocumentId: capsule.source.documentId,
      sourceVersionId: capsule.source.versionId,
    }
    await expect(prepareImmutableDraftSnapshot({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(prepareImmutableDraftSnapshot({ data: { ...data, capsuleHash: `sha256:${'f'.repeat(64)}` }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/hash|cápsula/i)
  })

  it('rejects updates, deletion and anonymous creation', async () => {
    await expect(prepareImmutableDraftSnapshot({ data: {}, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(prepareImmutableDraftSnapshot({ data: {}, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforceImmutableDraftSnapshotDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
