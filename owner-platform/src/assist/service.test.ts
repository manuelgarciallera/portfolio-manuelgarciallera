import { describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createOwnerAssistanceContext, createOwnerAssistanceProposal as createProposal, decideOwnerAssistanceProposal as decideProposal } from './service'

// Unit fixtures already substitute the database; inject only that boundary's
// transaction lifecycle. The integration suite uses real Payload transactions.
const transaction = { begin: async () => true, commit: async () => undefined, rollback: async () => undefined }
const createOwnerAssistanceProposal = (input: Parameters<typeof createProposal>[0]) => createProposal({ dependencies: transaction, ...input })
const decideOwnerAssistanceProposal = (input: Parameters<typeof decideProposal>[0]) => decideProposal({ dependencies: transaction, ...input })

const owner = { id: 1, collection: 'users', role: 'owner' }
const manifest = createPreviewManifest({
  brandTokens: {
    colors: [{ role: 'accent', value: '#FF4B44' }],
    motion: { duration: 600 },
    usageWeights: [{ role: 'accent', weight: 100 }],
  },
  mediaReferences: [],
  pageBlocks: [{ blockType: 'hero', heading: 'Hola' }],
  source: { collection: 'pages', documentId: '7', versionId: 'current:now' },
})
const patch = {
  capability: 'suggestCopy',
  operations: [{ op: 'replace', path: '/page/title', value: 'Nuevo título' }],
  schemaVersion: 1,
}

describe('createOwnerAssistanceContext', () => {
  it('loads and verifies the snapshot and active switches server-side', async () => {
    const payload = {
      create: vi.fn(),
      findByID: vi.fn(async () => ({ id: 12, manifest, manifestHash: manifest.hash })),
      findGlobal: vi.fn(async () => ({ suggestCopy: true, suggestMotion: true })),
    }
    const result = await createOwnerAssistanceContext({ payload, req: { user: owner }, sourceSnapshot: 12 })
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'preview-snapshots', depth: 0, id: 12, overrideAccess: false }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({
        action: 'assistant.context.exported',
        metadata: { snapshotHash: manifest.hash },
        outcome: 'success',
        subjectCollection: 'preview-snapshots',
        subjectId: '12',
      }),
      overrideAccess: true,
    }))
    expect(result).toMatchObject({ contentTrust: 'untrusted-editorial-data', permissions: { apply: false, capabilities: ['suggestCopy', 'suggestMotion'] }, snapshot: { hash: manifest.hash } })
  })

  it('rejects anonymous access and a mismatched stored manifest hash', async () => {
    await expect(createOwnerAssistanceContext({ payload: {} as never, req: { user: null }, sourceSnapshot: 12 })).rejects.toThrow(/owner/i)
    const payload = { create: vi.fn(), findByID: vi.fn(async () => ({ id: 12, manifest, manifestHash: 'sha256:other' })), findGlobal: vi.fn(async () => ({})) }
    await expect(createOwnerAssistanceContext({ payload, req: { user: owner }, sourceSnapshot: 12 })).rejects.toThrow(/snapshot|manifiesto/i)
  })
})

describe('createOwnerAssistanceProposal', () => {
  it.each([7, 'page-uuid'])('preserves the stored page id type (%s) and rejects mismatched lookups', async (pageId) => {
    const snapshot = createPreviewManifest({ ...manifest, pageBlocks: [...manifest.pageBlocks], mediaReferences: [...manifest.mediaReferences], source: { ...manifest.source, documentId: String(pageId) } })
    const create = vi.fn(async ({ data }) => ({ id: 31, ...data }))
    const payload = { create, findGlobal: async () => ({ suggestCopy: true }), findByID: async ({ collection }: { collection: string }) =>
      collection === 'preview-snapshots' ? { id: 12, manifest: snapshot, manifestHash: snapshot.hash } : { id: pageId, title: 'Inicio' } }
    await createOwnerAssistanceProposal({ patch, payload, provider: 'manual', req: { user: owner }, sourceSnapshot: '12' })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'assistance-proposals', data: expect.objectContaining({ targetPage: pageId }) }))
    create.mockClear()
    const mismatched = { ...payload, findByID: async ({ collection }: { collection: string }) =>
      collection === 'preview-snapshots' ? { id: 12, manifest: snapshot, manifestHash: snapshot.hash } : { id: 'wrong', title: 'Inicio' } }
    await expect(createOwnerAssistanceProposal({ patch, payload: mismatched, provider: 'manual', req: { user: owner }, sourceSnapshot: 12 })).rejects.toThrow(/no coincide/i)
    expect(create).not.toHaveBeenCalled()
  })

  it('derives context and switches server-side, persists a pending proposal and audits it', async () => {
    const create = vi.fn(async ({ collection, data }) =>
      collection === 'assistance-proposals' ? { id: 31, ...data } : { id: 32, ...data },
    )
    const payload = {
      create,
      findByID: vi.fn(async ({ collection }) =>
        collection === 'preview-snapshots'
          ? { id: 12, manifest, manifestHash: manifest.hash }
          : { id: 7, title: 'Inicio' },
      ),
      findGlobal: vi.fn(async () => ({ suggestCopy: true })),
    }
    const result = await createOwnerAssistanceProposal({
      patch,
      payload,
      provider: 'codex',
      req: { user: owner },
      sourceSnapshot: 12,
    })
    expect(payload.findGlobal).toHaveBeenCalledWith(expect.objectContaining({ slug: 'assistant-settings' }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'assistance-proposals',
      data: expect.objectContaining({
        capability: 'suggestCopy',
        createdBy: 1,
        sourceSnapshot: 12,
        status: 'pending',
        targetPage: 7,
      }),
      overrideAccess: true,
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({
        action: 'assistant.proposal.created',
        subjectCollection: 'assistance-proposals',
        subjectId: '31',
      }),
    }))
    expect(result).toMatchObject({ id: 31, status: 'pending' })
  })

  it('fails closed for anonymous users, disabled capabilities and snapshot tampering', async () => {
    await expect(createOwnerAssistanceProposal({ patch, payload: {} as never, provider: 'codex', req: { user: null }, sourceSnapshot: 12 })).rejects.toThrow(/owner/i)
    const base = {
      create: vi.fn(),
      findByID: vi.fn(async ({ collection }) => collection === 'preview-snapshots' ? { id: 12, manifest, manifestHash: manifest.hash } : { id: 7, title: 'Inicio' }),
      findGlobal: vi.fn(async () => ({ suggestCopy: false })),
    }
    await expect(createOwnerAssistanceProposal({ patch, payload: base, provider: 'codex', req: { user: owner }, sourceSnapshot: 12 })).rejects.toThrow(/desactivada/i)
    const tampered = { ...base, findGlobal: vi.fn(async () => ({ suggestCopy: true })), findByID: vi.fn(async ({ collection }) => collection === 'preview-snapshots' ? { id: 12, manifest: { ...manifest, hash: 'sha256:forged' }, manifestHash: manifest.hash } : { id: 7, title: 'Inicio' }) }
    await expect(createOwnerAssistanceProposal({ patch, payload: tampered, provider: 'codex', req: { user: owner }, sourceSnapshot: 12 })).rejects.toThrow(/snapshot|hash|manifiesto/i)
  })
})

describe('decideOwnerAssistanceProposal', () => {
  it('records one explicit owner decision without applying or publishing the patch', async () => {
    const proposal = { id: 31, status: 'pending', targetPage: 7 }
    const update = vi.fn(async ({ data }) => ({ ...proposal, ...data }))
    const create = vi.fn(async ({ data }) => ({ id: 40, ...data }))
    const payload = {
      create,
      findByID: vi.fn(async () => proposal),
      update,
    }
    const result = await decideOwnerAssistanceProposal({
      decision: 'accepted',
      note: 'Preview revisado',
      now: '2026-09-04T21:00:00.000Z',
      payload,
      proposalId: 31,
      req: { user: owner },
    })
    expect(update).toHaveBeenCalledWith({
      collection: 'assistance-proposals',
      data: {
        decidedAt: '2026-09-04T21:00:00.000Z',
        decidedBy: 1,
        decisionNote: 'Preview revisado',
        status: 'accepted',
      },
      id: 31,
      overrideAccess: true,
      req: { user: owner },
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ action: 'assistant.proposal.accepted', subjectId: '31' }),
    }))
    expect(result).toMatchObject({ id: 31, status: 'accepted' })
    expect(JSON.stringify(update.mock.calls)).not.toMatch(/apply|publish|deploy/)
  })

  it('rejects anonymous and repeated decisions before updating', async () => {
    await expect(decideOwnerAssistanceProposal({ decision: 'accepted', payload: {} as never, proposalId: 31, req: { user: null } })).rejects.toThrow(/owner/i)
    const update = vi.fn()
    await expect(decideOwnerAssistanceProposal({
      decision: 'rejected',
      payload: { create: vi.fn(), findByID: vi.fn(async () => ({ id: 31, status: 'accepted' })), update },
      proposalId: 31,
      req: { user: owner },
    })).rejects.toThrow(/pendiente/i)
    expect(update).not.toHaveBeenCalled()
  })
})

describe('assistance transaction failures', () => {
  it.each(['create', 'decide'] as const)('fails closed before %s writes when it cannot own a transaction', async (operation) => {
    const payload = {
      create: vi.fn(), update: vi.fn(), findGlobal: async () => ({ suggestCopy: true }),
      findByID: async ({ collection }: { collection: string }) => collection === 'preview-snapshots'
        ? { id: 12, manifest, manifestHash: manifest.hash }
        : collection === 'pages' ? { id: 7, title: 'Inicio' } : { id: 31, status: 'pending', targetPage: 7 },
    }
    const dependencies = { begin: async () => false, commit: vi.fn(), rollback: vi.fn() }
    const result = operation === 'create'
      ? createProposal({ dependencies, patch, payload, provider: 'manual', req: { user: owner }, sourceSnapshot: 12 })
      : decideProposal({ dependencies, decision: 'accepted', payload, req: { user: owner }, proposalId: 31 })
    await expect(result).rejects.toMatchObject({ status: 503 })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    // Never commit or roll back a transaction owned by another caller.
    expect(dependencies.commit).not.toHaveBeenCalled()
    expect(dependencies.rollback).not.toHaveBeenCalled()
  })
})
