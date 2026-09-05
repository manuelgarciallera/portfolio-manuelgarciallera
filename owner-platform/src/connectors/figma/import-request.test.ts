import { describe, expect, it, vi } from 'vitest'

import { handleFigmaImportPlanRequest, parseFigmaImportPlanRequest } from './import-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('Figma import plan request', () => {
  it('accepts one explicitly confirmed bounded selection', () => {
    expect(parseFigmaImportPlanRequest({
      candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', source: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=12-34',
    })).toEqual({ candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', source: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=12-34' })
  })

  it('rejects unknown fields, unsafe IDs, and mismatched confirmation', () => {
    const base = { candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', source: 'https://www.figma.com/design/AbCdEf/Portfolio' }
    expect(() => parseFigmaImportPlanRequest({ ...base, publish: true })).toThrow(/campo/i)
    expect(() => parseFigmaImportPlanRequest({ ...base, candidateId: '../users' })).toThrow(/candidato/i)
    expect(() => parseFigmaImportPlanRequest({ ...base, confirmation: 'IMPORTAR' })).toThrow(/confirmación/i)
  })

  it('authenticates before reading and returns only the created plan record', async () => {
    let reads = 0
    const denied = { headers: new Headers(), get body() { reads += 1; return null } } as Request
    const deniedResponse = await handleFigmaImportPlanRequest(denied, { authenticate: async () => ({ user: null }), create: vi.fn() })
    expect(deniedResponse.status).toBe(403)
    expect(reads).toBe(0)

    const create = vi.fn(async () => ({ id: 44, status: 'pending' }))
    const request = new Request('http://owner.test/api/owner/figma/import-plans', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', source: 'https://www.figma.com/design/AbCdEf/Portfolio' }) })
    const response = await handleFigmaImportPlanRequest(request, { authenticate: async () => ({ user: owner }), create })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ importPlan: { id: 44, status: 'pending' } })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ candidateId: '12:34' }), owner)
  })
})
