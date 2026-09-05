import { describe, expect, it, vi } from 'vitest'

import { handleFigmaImportExecutionRequest, parseFigmaImportExecutionRequest } from './import-execution-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('Figma import execution request', () => {
  it('accepts only bounded alternative text and the exact import phrase', () => {
    expect(parseFigmaImportExecutionRequest({ alt: ' Vista principal ', confirmation: 'IMPORTAR PNG DE FIGMA' })).toEqual({ alt: 'Vista principal', confirmation: 'IMPORTAR PNG DE FIGMA' })
    expect(() => parseFigmaImportExecutionRequest({ alt: '', confirmation: 'IMPORTAR PNG DE FIGMA' })).toThrow(/alternativo/i)
    expect(() => parseFigmaImportExecutionRequest({ alt: 'Vista', confirmation: 'IMPORTAR' })).toThrow(/confirmación/i)
    expect(() => parseFigmaImportExecutionRequest({ alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA', publish: true })).toThrow(/campo/i)
  })

  it('authenticates before parsing and executing the bounded import', async () => {
    const execute = vi.fn(async () => ({ id: 73 }))
    const request = new Request('http://owner.test', { method: 'POST', body: JSON.stringify({ alt: 'Vista principal', confirmation: 'IMPORTAR PNG DE FIGMA' }) })
    const denied = await handleFigmaImportExecutionRequest(request.clone(), 45, { authenticate: async () => ({ user: null }), execute })
    expect(denied.status).toBe(403)
    expect(execute).not.toHaveBeenCalled()
    const response = await handleFigmaImportExecutionRequest(request, 45, { authenticate: async () => ({ user: owner }), execute })
    expect(response.status).toBe(201)
    expect(execute).toHaveBeenCalledWith({ alt: 'Vista principal', confirmation: 'IMPORTAR PNG DE FIGMA', reviewId: 45 }, owner)
    await expect(response.json()).resolves.toEqual({ execution: { id: 73 } })
  })
})
