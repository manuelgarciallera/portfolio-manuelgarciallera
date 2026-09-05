import { describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createDraftCapsule } from '../recovery/capsule'
import { confirmOwnerRestorePlan, createOwnerRestorePlan } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const makeManifest = (title: string) => createPreviewManifest({
  brandTokens: { colors: [], motion: {}, usageWeights: [] },
  mediaReferences: [],
  pageBlocks: [{ blockType: 'hero', heading: title }],
  source: { collection: 'pages', documentId: '7', versionId: `current:${title}` },
})
const targetManifest = makeManifest('target')
const baselineManifest = makeManifest('baseline')
const targetCapsule = createDraftCapsule({
  source: targetManifest.source,
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})

describe('restore plan service', () => {
  it('creates a plan from one release and a verified current baseline', async () => {
    const create = vi.fn(async ({ collection, data }) =>
      collection === 'restore-plans' ? { id: 50, ...data, status: 'ready' } : { id: 51, ...data },
    )
    const payload = {
      create,
      findByID: vi.fn(async ({ collection, id }) => {
        if (collection === 'releases') return { draftSnapshot: 11, id: 44, previewSnapshot: 10 }
        if (collection === 'pages') return { id: 7 }
        if (collection === 'draft-snapshots') return { capsule: targetCapsule, capsuleHash: targetCapsule.hash, id: 11 }
        if (id === 10) return { id: 10, manifest: targetManifest, manifestHash: targetManifest.hash }
        return { id: 12, manifest: baselineManifest, manifestHash: baselineManifest.hash }
      }),
    }
    const result = await createOwnerRestorePlan({
      baselineSnapshot: 12,
      confirmation: 'PREPARAR RESTAURACIÓN',
      payload,
      releaseId: 44,
      req: { user: owner },
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'restore-plans',
      data: expect.objectContaining({
        baselineHash: baselineManifest.hash,
        release: 44,
        targetHash: targetManifest.hash,
        targetCapsuleHash: targetCapsule.hash,
        targetDraftSnapshot: 11,
        targetPage: 7,
        targetSnapshot: 10,
      }),
      overrideAccess: true,
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ action: 'restore.plan.created', subjectId: '50' }),
    }))
    expect(result).toMatchObject({ id: 50, status: 'ready' })
  })

  it('rejects plans whose release target and current baseline belong to different pages', async () => {
    const other = createPreviewManifest({
      brandTokens: { colors: [], motion: {}, usageWeights: [] }, mediaReferences: [], pageBlocks: [],
      source: { collection: 'pages', documentId: '8', versionId: 'current:other' },
    })
    const payload = {
      create: vi.fn(),
      findByID: vi.fn(async ({ collection, id }) => collection === 'releases'
        ? { draftSnapshot: 11, id: 44, previewSnapshot: 10 }
        : collection === 'draft-snapshots'
          ? { capsule: targetCapsule, capsuleHash: targetCapsule.hash, id: 11 }
        : id === 10
          ? { id: 10, manifest: targetManifest, manifestHash: targetManifest.hash }
          : { id: 12, manifest: other, manifestHash: other.hash }),
    }
    await expect(createOwnerRestorePlan({ baselineSnapshot: 12, confirmation: 'PREPARAR RESTAURACIÓN', payload, releaseId: 44, req: { user: owner } })).rejects.toThrow(/página|documento/i)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('confirms against a fresh matching snapshot or records a conflict, without restoring', async () => {
    const update = vi.fn(async ({ data }) => ({ id: 50, ...data }))
    const create = vi.fn(async ({ data }) => ({ id: 60, ...data }))
    const payload = {
      create,
      findByID: vi.fn(async ({ collection }) => collection === 'restore-plans'
        ? { id: 50, baselineHash: baselineManifest.hash, status: 'ready', targetPage: 7 }
        : { id: 13, manifest: baselineManifest, manifestHash: baselineManifest.hash }),
      update,
    }
    const result = await confirmOwnerRestorePlan({
      confirmation: 'CONFIRMAR RESTAURACIÓN',
      currentSnapshot: 13,
      now: '2026-09-04T23:00:00.000Z',
      payload,
      planId: 50,
      req: { user: owner },
    })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'restore-plans',
      data: expect.objectContaining({ status: 'confirmed', confirmationSnapshot: 13 }),
      id: 50,
      overrideAccess: true,
    }))
    expect(result).toMatchObject({ status: 'confirmed' })
    expect(JSON.stringify([...update.mock.calls, ...create.mock.calls])).not.toMatch(/page.*update|publish|deploy|execute/i)
  })
})
