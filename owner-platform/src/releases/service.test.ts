import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from 'payload'

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
  it.each([
    { status: 500, data: { collection: 'releases', errors: [{ path: 'gitCommit' }] } },
    { status: 400, data: { collection: 'pages', errors: [{ path: 'gitCommit' }] } },
    { status: 400, data: { collection: 'releases', errors: null } },
    { status: 400, data: { collection: 'releases', errors: [null, { path: 'name' }] } },
  ])('does not reinterpret unrelated adapter errors: %j', async envelope => {
    const failure = Object.assign(new Error('Adapter failure'), envelope)
    const payload = { create: vi.fn(async () => { throw failure }),
      find: vi.fn(async () => ({ docs: [{ id: 44 }] })),
      findByID: vi.fn(async ({ collection }) => collection === 'preview-snapshots'
        ? { manifest, manifestHash: manifest.hash } : { capsule, capsuleHash: capsule.hash }),
    }
    await expect(createOwnerRelease({ input: { previewSnapshot: 12, draftSnapshot: 13, gitCommit: 'a'.repeat(40) }, payload, req: { user: owner } })).rejects.toBe(failure)
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).toHaveBeenCalledTimes(1)
  })
  it.each(['no winner', 'read failure', 'other field', 'database failure'])('preserves the original error for %s', async kind => {
    const failure = kind === 'database failure' ? new Error('Database unavailable')
      : new ValidationError({ collection: 'releases', errors: [{ path: kind === 'other field' ? 'name' : 'gitCommit', message: 'Invalid' }] })
    const payload = { create: vi.fn(async () => { throw failure }),
      find: vi.fn(async () => { if (kind === 'read failure') throw new Error('Read unavailable'); return { docs: [] } }),
      findByID: vi.fn(async ({ collection }) => collection === 'preview-snapshots'
        ? { manifest, manifestHash: manifest.hash } : { capsule, capsuleHash: capsule.hash }),
    }
    await expect(createOwnerRelease({ input: { previewSnapshot: 12, draftSnapshot: 13, gitCommit: 'a'.repeat(40) }, payload, req: { user: owner } })).rejects.toBe(failure)
    expect(payload.create).toHaveBeenCalledTimes(1)
    if (kind === 'other field' || kind === 'database failure') expect(payload.find).not.toHaveBeenCalled()
  })
  it.each([false, true])('reports a stored commit conflict across module boundaries: %s', async foreignModule => {
    const native = new ValidationError({ collection: 'releases', errors: [{ path: 'gitCommit', message: 'Unique' }] })
    const failure = foreignModule ? Object.assign(new Error(native.message), { status: native.status, data: native.data }) : native
    const create = vi.fn(async () => { throw failure })
    const payload = { create,
      find: vi.fn(async () => ({ docs: [{ id: 44 }] })),
      findByID: vi.fn(async ({ collection }) => collection === 'preview-snapshots'
        ? { manifest, manifestHash: manifest.hash } : { capsule, capsuleHash: capsule.hash }),
    }
    await expect(createOwnerRelease({ input: { previewSnapshot: 12, draftSnapshot: 13, gitCommit: 'a'.repeat(40) }, payload, req: { user: owner } }))
      .rejects.toMatchObject({ status: 409 })
    expect(create).toHaveBeenCalledTimes(1)
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'releases', overrideAccess: false, where: { gitCommit: { equals: 'a'.repeat(40) } } }))
  })
  it('binds an immutable release to a verified snapshot and audits registration', async () => {
    const create = vi.fn(async ({ collection, data }) =>
      collection === 'releases' ? { id: 44, ...data } : { id: 45, ...data },
    )
    const payload = {
      create,
      find: vi.fn(async () => ({ docs: [] })),
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
      find: vi.fn(async () => ({ docs: [] })),
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
