import { describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createDraftCapsule } from '../recovery/capsule'
import { prepareOwnerRestorePlan } from './prepare'

const owner = { id: 1, collection: 'users', role: 'owner' }
const brand = {
  id: 3,
  colors: [
    { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
    { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
    { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
    { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
  ],
  motion: { duration: 600, easing: 'ease-out', reducedMotion: 'reduce', stagger: 80, travel: 24 },
  usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
}
const target = createPreviewManifest({
  brandTokens: { colors: [], motion: {}, usageWeights: [] },
  mediaReferences: [],
  pageBlocks: [],
  source: { collection: 'pages', documentId: '7', versionId: 'current:old' },
})
const targetDraft = createDraftCapsule({
  source: target.source,
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})

describe('prepare owner restore plan', () => {
  it('captures the current target page before creating a reviewable plan', async () => {
    let baseline: Record<string, unknown> | undefined
    const create = vi.fn(async ({ collection, data }) => {
      if (collection === 'preview-snapshots') baseline = { id: 12, ...data }
      if (collection === 'restore-plans') return { id: 50, status: 'ready', ...data }
      return { id: 90, ...data }
    })
    const findByID = vi.fn(async ({ collection, id }) => {
      if (collection === 'releases') return { draftSnapshot: 11, id: 44, previewSnapshot: 10 }
      if (collection === 'draft-snapshots') return { capsule: targetDraft, capsuleHash: targetDraft.hash, id: 11 }
      if (collection === 'preview-snapshots') return id === 10 ? { id: 10, manifest: target, manifestHash: target.hash } : baseline
      if (collection === 'pages') return { brandProfile: 3, id: 7, layout: [], slug: 'inicio', title: 'Inicio', updatedAt: '2026-09-05T11:00:00.000Z' }
      if (collection === 'brand-profiles') return brand
      throw new Error(`Unexpected ${collection}`)
    })

    await expect(prepareOwnerRestorePlan({ payload: { create, findByID, find: async () => ({ docs: [] }) } as never, releaseId: 44, req: { user: owner } as never })).resolves.toMatchObject({ id: 50, status: 'ready' })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'preview-snapshots' }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'restore-plans', data: expect.objectContaining({ baselineSnapshot: 12, release: 44, targetPage: 7 }) }))
  })

  it('rejects unauthenticated preparation before reading a release', async () => {
    const findByID = vi.fn()
    await expect(prepareOwnerRestorePlan({ payload: { create: vi.fn(), findByID } as never, releaseId: 44, req: { user: null } as never })).rejects.toThrow(/owner/i)
    expect(findByID).not.toHaveBeenCalled()
  })
})
