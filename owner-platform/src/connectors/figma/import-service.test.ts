import { describe, expect, it, vi } from 'vitest'

import { createOwnerFigmaImportPlan } from './import-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const discovered = {
  ok: true as const,
  file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' },
  candidates: [{ id: '12:34', name: 'Hero', type: 'FRAME' as const, width: 1440, height: 900, sourceUrl: 'https://www.figma.com/design/AbCdEf?node-id=12-34', preview: { url: 'https://s3-alpha.figma.com/render.png', expiresAfterDays: 30 as const } }],
  truncated: false,
}

describe('owner Figma import plan service', () => {
  it('rediscovers the candidate and persists an audited immutable plan without its temporary URL', async () => {
    const create = vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => collection === 'figma-import-plans' ? { id: 44, ...data } : { id: 45 })
    const result = await createOwnerFigmaImportPlan({
      candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', now: '2026-09-05T05:00:00.000Z',
      payload: { create }, provider: { discover: vi.fn(async () => discovered) }, req: { user: owner }, source: 'https://www.figma.com/design/AbCdEf/Portfolio',
    })
    expect(result).toMatchObject({ id: 44, candidateName: 'Hero', candidateType: 'FRAME', nodeId: '12:34', sourceFileKey: 'AbCdEf', status: 'pending' })
    const stored = create.mock.calls[0]?.[0].data
    expect(JSON.stringify(stored)).not.toContain('s3-alpha')
    expect(create).toHaveBeenNthCalledWith(1, expect.objectContaining({ collection: 'figma-import-plans', overrideAccess: true, req: expect.any(Object) }))
    expect(create).toHaveBeenNthCalledWith(2, expect.objectContaining({ collection: 'audit-events', overrideAccess: true }))
  })

  it('fails closed when rediscovery fails or the selected node is absent', async () => {
    const create = vi.fn()
    await expect(createOwnerFigmaImportPlan({ candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', payload: { create }, provider: { discover: async () => ({ ok: false, code: 'rate_limited', message: 'secret upstream body', retryAfter: '60' }) }, req: { user: owner }, source: 'https://www.figma.com/design/AbCdEf/Portfolio' })).rejects.toMatchObject({ status: 429 })
    await expect(createOwnerFigmaImportPlan({ candidateId: '99:99', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', payload: { create }, provider: { discover: async () => discovered }, req: { user: owner }, source: 'https://www.figma.com/design/AbCdEf/Portfolio' })).rejects.toMatchObject({ status: 404 })
    expect(create).not.toHaveBeenCalled()
  })

  it('requires owner authentication and the exact confirmation before discovery', async () => {
    const discover = vi.fn()
    const payload = { create: vi.fn() }
    await expect(createOwnerFigmaImportPlan({ candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', payload, provider: { discover }, req: { user: null }, source: 'https://www.figma.com/design/AbCdEf/Portfolio' })).rejects.toMatchObject({ status: 403 })
    await expect(createOwnerFigmaImportPlan({ candidateId: '12:34', confirmation: 'IMPORTAR', payload, provider: { discover }, req: { user: owner }, source: 'https://www.figma.com/design/AbCdEf/Portfolio' } as never)).rejects.toMatchObject({ status: 400 })
    expect(discover).not.toHaveBeenCalled()
  })
})
