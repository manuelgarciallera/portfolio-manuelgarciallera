import { describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createDraftCapsule } from '../recovery/capsule'
import { executeOwnerRestorePlan } from './execute'

const owner = { id: 1, collection: 'users', role: 'owner' }
const targetCapsule = createDraftCapsule({
  source: { collection: 'pages', documentId: '7', versionId: 'current:old' },
  state: {
    brandOverrides: { accent: '#FF4B44' },
    brandProfile: 3,
    layout: [{ blockType: 'hero', heading: 'Versión restaurada' }],
    slug: 'inicio',
    title: 'Inicio restaurado',
  },
})
const confirmationManifest = createPreviewManifest({
  brandTokens: { colors: [], motion: {}, usageWeights: [] },
  mediaReferences: [],
  pageBlocks: [{ blockType: 'hero', heading: 'Actual' }],
  source: { collection: 'pages', documentId: '7', versionId: 'current:2026-09-04T23:10:00.000Z' },
})

const makePayload = (events: string[]) => ({
  create: vi.fn(async ({ collection, data }) => { events.push(`create:${collection}`); return { id: 90, ...data } }),
  findByID: vi.fn(async ({ collection }) => {
    if (collection === 'restore-plans') return {
      confirmationSnapshot: 13,
      id: 50,
      status: 'confirmed',
      targetCapsuleHash: targetCapsule.hash,
      targetDraftSnapshot: 11,
      targetPage: 7,
    }
    if (collection === 'draft-snapshots') return { capsule: targetCapsule, capsuleHash: targetCapsule.hash, id: 11 }
    if (collection === 'preview-snapshots') return { id: 13, manifest: confirmationManifest, manifestHash: confirmationManifest.hash }
    return { id: 7, updatedAt: '2026-09-04T23:10:00.000Z' }
  }),
  update: vi.fn(async ({ collection, data }) => {
    events.push(`update:${collection}`)
    return collection === 'pages'
      ? { docs: [{ id: 7, updatedAt: '2026-09-04T23:15:00.000Z', ...data }] }
      : { id: 50, ...data }
  }),
})

describe('executeOwnerRestorePlan', () => {
  it('restores only a draft atomically, snapshots the result and marks the plan executed', async () => {
    const events: string[] = []
    const payload = makePayload(events)
    const dependencies = {
      begin: vi.fn(async () => { events.push('begin'); return true }),
      commit: vi.fn(async () => { events.push('commit') }),
      rollback: vi.fn(async () => { events.push('rollback') }),
      createDraft: vi.fn(async () => { events.push('snapshot:draft'); return { id: 71, capsule: { source: { versionId: 'current:2026-09-04T23:15:00.000Z' } } } }),
      createPreview: vi.fn(async () => { events.push('snapshot:preview'); return { id: 72 } }),
    }
    const result = await executeOwnerRestorePlan({
      confirmation: 'EJECUTAR RESTAURACIÓN',
      dependencies,
      now: '2026-09-04T23:15:01.000Z',
      payload,
      planId: 50,
      req: { payload, user: owner },
    })
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'pages',
      data: targetCapsule.state,
      draft: true,
      overrideAccess: false,
      where: { and: [{ id: { equals: 7 } }, { updatedAt: { equals: '2026-09-04T23:10:00.000Z' } }] },
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'restore-plans',
      data: expect.objectContaining({ resultDraftSnapshot: 71, resultPreviewSnapshot: 72, status: 'executed' }),
    }))
    expect(events).toEqual([
      'begin', 'update:pages', 'snapshot:draft', 'snapshot:preview', 'update:restore-plans', 'create:audit-events', 'commit',
    ])
    expect(dependencies.rollback).not.toHaveBeenCalled()
    expect(result).toMatchObject({ status: 'executed' })
  })

  it('rejects a stale confirmation inside the transaction before writing', async () => {
    const events: string[] = []
    const payload = makePayload(events)
    payload.findByID.mockImplementation(async ({ collection }) => collection === 'pages'
      ? { id: 7, updatedAt: '2026-09-04T23:11:00.000Z' }
      : collection === 'restore-plans'
        ? { confirmationSnapshot: 13, id: 50, status: 'confirmed', targetCapsuleHash: targetCapsule.hash, targetDraftSnapshot: 11, targetPage: 7 }
        : collection === 'draft-snapshots'
          ? { capsule: targetCapsule, capsuleHash: targetCapsule.hash, id: 11 }
          : { id: 13, manifest: confirmationManifest, manifestHash: confirmationManifest.hash })
    const begin = vi.fn(async () => true)
    const rollback = vi.fn()
    await expect(executeOwnerRestorePlan({
      confirmation: 'EJECUTAR RESTAURACIÓN', dependencies: { begin, rollback } as never, payload, planId: 50, req: { payload, user: owner },
    })).rejects.toThrow(/cambió|revisión|conflicto/i)
    expect(begin).toHaveBeenCalledOnce()
    expect(rollback).toHaveBeenCalledOnce()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('rolls back every write when result verification fails', async () => {
    const events: string[] = []
    const payload = makePayload(events)
    const rollback = vi.fn(async () => { events.push('rollback') })
    await expect(executeOwnerRestorePlan({
      confirmation: 'EJECUTAR RESTAURACIÓN',
      dependencies: {
        begin: async () => { events.push('begin'); return true },
        commit: async () => { events.push('commit') },
        rollback,
        createDraft: async () => { events.push('snapshot:draft'); return { id: 71, capsule: { source: { versionId: 'current:new' } } } },
        createPreview: async () => { throw new Error('snapshot failed with secret') },
      },
      payload,
      planId: 50,
      req: { payload, user: owner },
    })).rejects.toThrow(/snapshot failed/i)
    expect(rollback).toHaveBeenCalledOnce()
    expect(events).toContain('rollback')
    expect(events).not.toContain('commit')
  })
})
