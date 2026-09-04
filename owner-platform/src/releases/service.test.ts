import { describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createDraftCapsule } from '../recovery/capsule'
import { createOwnerRelease } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const manifest = createPreviewManifest({
  brandTokens: { colors: [], motion: {}, usageWeights: [] },
  mediaReferences: [],
  pageBlocks: [],
  source: { collection: 'pages', documentId: '7', versionId: 'current:now' },
})
const quality = [{
  accessibility: 98,
  measuredAt: '2026-09-04T22:00:00.000Z',
  performance: 96,
  source: 'lighthouse',
  usability: 97,
  viewport: 'desktop',
}]
const capsule = createDraftCapsule({
  source: manifest.source,
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})

describe('createOwnerRelease', () => {
  it('binds an immutable release to a verified snapshot and audits registration', async () => {
    const create = vi.fn(async ({ collection, data }) =>
      collection === 'releases' ? { id: 44, ...data } : { id: 45, ...data },
    )
    const payload = {
      create,
      findByID: vi.fn(async ({ collection }) => collection === 'preview-snapshots'
        ? { id: 12, manifest, manifestHash: manifest.hash }
        : { id: 13, capsule, capsuleHash: capsule.hash }),
    }
    const result = await createOwnerRelease({
      input: {
        changeSummary: 'Endpoints owner revisados.',
        draftSnapshot: 13,
        gitCommit: 'a'.repeat(40),
        name: 'Checkpoint API owner',
        previewSnapshot: 12,
        quality,
      },
      payload,
      req: { user: owner },
    })
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'preview-snapshots',
      id: 12,
      overrideAccess: false,
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'releases',
      data: expect.objectContaining({ createdBy: 1, draftSnapshot: 13, gitCommit: 'a'.repeat(40), previewSnapshot: 12 }),
      overrideAccess: true,
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ action: 'release.registered', subjectId: '44' }),
    }))
    expect(result).toMatchObject({ id: 44, gitCommit: 'a'.repeat(40) })
  })

  it('fails closed for anonymous owners and snapshot tampering', async () => {
    await expect(createOwnerRelease({ input: {}, payload: {} as never, req: { user: null } })).rejects.toThrow(/owner/i)
    const payload = {
      create: vi.fn(),
      findByID: vi.fn(async () => ({ id: 12, manifest, manifestHash: 'sha256:forged' })),
    }
    await expect(createOwnerRelease({
      input: { changeSummary: 'x', draftSnapshot: 13, gitCommit: 'a'.repeat(40), name: 'x', previewSnapshot: 12, quality },
      payload,
      req: { user: owner },
    })).rejects.toThrow(/snapshot|manifiesto|hash/i)
    expect(payload.create).not.toHaveBeenCalled()
  })
})
