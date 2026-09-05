import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createFigmaImportPlan } from './import-plan'
import { createFigmaImportReview } from './import-review'
import { executeOwnerFigmaImport } from './import-execution-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const candidate = { id: '1:2', name: 'Hero principal', type: 'FRAME' as const, width: 1440, height: 900, sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=1-2' }
const plan = createFigmaImportPlan({ candidate: { ...candidate, preview: { url: 'https://api-cdn.figma.com/old.png', expiresAfterDays: 30 } }, file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' }, observedAt: '2026-09-05T05:00:00.000Z', source: { fileKey: 'AbCdEf', sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio' } })
const review = createFigmaImportReview({ decidedAt: '2026-09-05T06:00:00.000Z', decidedBy: 1, decision: 'approved', planHash: plan.hash, planId: 44 })
const reviewDocument = { ...review, id: 45, plan: 44, reviewHash: review.hash }
const planDocument = { id: 44, plan, planHash: plan.hash }
const provider = { discover: vi.fn(async () => ({ ok: true as const, file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' }, candidates: [{ ...candidate, preview: { url: 'https://api-cdn.figma.com/fresh.png', expiresAfterDays: 30 as const } }], truncated: false })) }
const transaction = { begin: async () => true, commit: async () => undefined, rollback: async () => undefined }

const setup = () => {
  const create = vi.fn(async ({ collection }: { collection: string }) => collection === 'media' ? { id: 72, _status: 'draft' } : collection === 'media-placements' ? { id: 71, _status: 'draft' } : collection === 'figma-import-executions' ? { id: 73 } : { id: 74 })
  const find = vi.fn(async (): Promise<{ docs: Array<Record<string, unknown>> }> => ({ docs: [] }))
  const findByID = vi.fn(async ({ collection }: { collection: string }) => collection === 'figma-import-reviews' ? reviewDocument : planDocument)
  const payload = { create, find, findByID }
  const download = vi.fn(async () => ({ data: Buffer.from('png'), mimeType: 'image/png' as const, size: 3 }))
  return { create, download, find, findByID, payload }
}

describe('executeOwnerFigmaImport', () => {
  it('revalidates approved evidence and fresh Figma metadata before creating draft media and immutable execution evidence', async () => {
    const { create, download, payload } = setup()
    const result = await executeOwnerFigmaImport({ alt: 'Vista principal del portfolio', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download, now: '2026-09-05T07:30:00.000Z', payload, provider, req: { user: owner }, reviewId: 45 })

    expect(result).toMatchObject({ id: 73 })
    expect(download).toHaveBeenCalledWith('https://api-cdn.figma.com/fresh.png')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'media', overrideAccess: true, req: { user: owner },
      data: expect.objectContaining({ _status: 'draft', alt: 'Vista principal del portfolio', credit: 'Figma · Portfolio · Hero principal' }),
      file: expect.objectContaining({ data: Buffer.from('png'), mimetype: 'image/png', name: 'hero-principal.png', size: 3 }),
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media-placements', data: { _status: 'draft', name: 'Hero principal · encuadre', placement: { asset: 72 } } }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'figma-import-executions', data: expect.objectContaining({ contentHash: `sha256:${createHash('sha256').update('png').digest('hex')}`, media: 72, placement: 71, plan: 44, review: 45 }) }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'figma.import.executed', subjectCollection: 'figma-import-executions' }) }))
    expect(JSON.stringify(create.mock.calls)).not.toMatch(/publish|deploy|publicBridge/)
  })

  it('requires owner authentication, exact confirmation, bounded alt text, and one execution per review', async () => {
    const { payload, download } = setup()
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download, payload, provider, req: {}, reviewId: 45 })).rejects.toThrow(/owner/i)
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR', dependencies: transaction, download, payload, provider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/confirmación/i)
    await expect(executeOwnerFigmaImport({ alt: '', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download, payload, provider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/alternativo/i)
    payload.find = vi.fn(async () => ({ docs: [{ id: 73 }] }))
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download, payload, provider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/importada/i)
    expect(download).not.toHaveBeenCalled()
  })

  it('rejects rejected or tampered reviews and plans before downloading', async () => {
    const first = setup()
    first.payload.findByID = vi.fn(async ({ collection }: { collection: string }) => collection === 'figma-import-reviews' ? { ...reviewDocument, decision: 'rejected' } : planDocument)
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download: first.download, payload: first.payload, provider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/aprobada|integridad/i)
    const second = setup()
    second.payload.findByID = vi.fn(async ({ collection }: { collection: string }) => collection === 'figma-import-reviews' ? reviewDocument : { ...planDocument, planHash: `sha256:${'0'.repeat(64)}` })
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download: second.download, payload: second.payload, provider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/integridad|hash/i)
    expect(second.download).not.toHaveBeenCalled()
  })

  it('stops when the approved node changed or has no fresh PNG render', async () => {
    const changed = setup()
    const changedProvider = { discover: vi.fn(async () => ({ ok: true as const, file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' }, candidates: [{ ...candidate, name: 'Hero changed', preview: { url: 'https://api-cdn.figma.com/fresh.png', expiresAfterDays: 30 as const } }], truncated: false })) }
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download: changed.download, payload: changed.payload, provider: changedProvider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/cambiado/i)
    const missing = setup()
    const missingProvider = { discover: vi.fn(async () => ({ ok: true as const, file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' }, candidates: [{ ...candidate, preview: { url: null, expiresAfterDays: 30 as const } }], truncated: false })) }
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: transaction, download: missing.download, payload: missing.payload, provider: missingProvider, req: { user: owner }, reviewId: 45 })).rejects.toThrow(/render/i)
  })

  it('creates media, execution evidence, and audit atomically and rolls back partial writes', async () => {
    const success = setup()
    const successEvents: string[] = []
    success.create.mockImplementation(async ({ collection }: { collection: string }) => { successEvents.push(`create:${collection}`); return collection === 'media' ? { id: 72 } : collection === 'media-placements' ? { id: 71 } : collection === 'figma-import-executions' ? { id: 73 } : { id: 74 } })
    const successTransaction = {
      begin: vi.fn(async () => { successEvents.push('begin'); return true }),
      commit: vi.fn(async () => { successEvents.push('commit') }),
      rollback: vi.fn(async () => { successEvents.push('rollback') }),
    }
    await executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: successTransaction, download: success.download, payload: success.payload, provider, req: { payload: success.payload, user: owner }, reviewId: 45 })
    expect(successEvents).toEqual(['begin', 'create:media', 'create:media-placements', 'create:figma-import-executions', 'create:audit-events', 'commit'])
    expect(successTransaction.rollback).not.toHaveBeenCalled()

    const failure = setup()
    failure.create.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'figma-import-executions') throw new Error('evidence failed')
      return { id: 72 }
    })
    const failureTransaction = { begin: vi.fn(async () => true), commit: vi.fn(), rollback: vi.fn(async () => undefined) }
    await expect(executeOwnerFigmaImport({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', dependencies: failureTransaction, download: failure.download, payload: failure.payload, provider, req: { payload: failure.payload, user: owner }, reviewId: 45 })).rejects.toThrow(/evidence failed/i)
    expect(failureTransaction.rollback).toHaveBeenCalledOnce()
    expect(failureTransaction.commit).not.toHaveBeenCalled()
  })
})
