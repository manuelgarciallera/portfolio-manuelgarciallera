import { describe, expect, it, vi } from 'vitest'

import { createFigmaImportPlan } from './import-plan'
import { createOwnerFigmaImportReview } from './import-review-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const plan = createFigmaImportPlan({ candidate: { id: '1:2', name: 'Hero', type: 'FRAME', sourceUrl: 'https://www.figma.com/design/AbCdEf?node-id=1-2' }, file: { name: 'Portfolio' }, observedAt: '2026-09-05T05:00:00.000Z', source: { fileKey: 'AbCdEf', sourceUrl: 'https://www.figma.com/design/AbCdEf' } })

describe('owner Figma import review service', () => {
  it.each([44, 'plan-uuid'])('preserves the stored plan id type (%s) when addressed by URL', async (id) => {
    const create = vi.fn(async ({ data }) => ({ id: 50, ...data }))
    const payload = { create, find: async () => ({ docs: [] }), findByID: async () => ({ id, plan, planHash: plan.hash }) }
    const result = await createOwnerFigmaImportReview({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', payload, planId: String(id), req: { user: owner } })
    expect(result.plan).toBe(id)
    await expect(createOwnerFigmaImportReview({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', payload, planId: 'wrong', req: { user: owner } })).rejects.toThrow(/no coincide/i)
  })

  it('verifies the plan, prevents repeat decisions, and audits approval', async () => {
    const create = vi.fn(async ({ collection, data }) => collection === 'figma-import-reviews' ? { id: 50, ...data } : { id: 51 })
    const payload = { create, find: vi.fn(async () => ({ docs: [] })), findByID: vi.fn(async () => ({ id: 44, plan, planHash: plan.hash })) }
    const result = await createOwnerFigmaImportReview({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', note: 'Revisado.', now: '2026-09-05T06:00:00.000Z', payload, planId: 44, req: { user: owner } })
    expect(result).toMatchObject({ id: 50, decision: 'approved', plan: 44, planHash: plan.hash })
    expect(create).toHaveBeenNthCalledWith(1, expect.objectContaining({ collection: 'figma-import-reviews', overrideAccess: true }))
    expect(create).toHaveBeenNthCalledWith(2, expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'figma.plan.approved', subjectId: '44' }) }))
  })

  it('rejects anonymous, repeated, tampered, and mismatched decisions', async () => {
    const empty = { create: vi.fn(), find: vi.fn(async () => ({ docs: [] })), findByID: vi.fn(async () => ({ id: 44, plan, planHash: plan.hash })) }
    await expect(createOwnerFigmaImportReview({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', payload: empty, planId: 44, req: { user: null } })).rejects.toMatchObject({ status: 403 })
    await expect(createOwnerFigmaImportReview({ confirmation: 'RECHAZAR IMPORTACIÓN FIGMA', decision: 'approved', payload: empty, planId: 44, req: { user: owner } })).rejects.toMatchObject({ status: 400 })
    await expect(createOwnerFigmaImportReview({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', payload: { ...empty, find: vi.fn(async () => ({ docs: [{ id: 50 }] })) }, planId: 44, req: { user: owner } })).rejects.toMatchObject({ status: 409 })
    await expect(createOwnerFigmaImportReview({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', payload: { ...empty, findByID: vi.fn(async () => ({ id: 44, plan: { ...plan, candidate: { ...plan.candidate, name: 'Otro' } }, planHash: plan.hash })) }, planId: 44, req: { user: owner } })).rejects.toMatchObject({ status: 409 })
  })
})
