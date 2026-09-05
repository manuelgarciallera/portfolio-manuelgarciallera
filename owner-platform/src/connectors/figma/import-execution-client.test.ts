import { describe, expect, it, vi } from 'vitest'

import { executeFigmaImport } from './import-execution-client'

describe('executeFigmaImport', () => {
  it('submits the exact bounded execution envelope and returns safe owner destinations', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ execution: { id: 73, media: 72, placement: 71 } }), { status: 201 }))
    await expect(executeFigmaImport(45, { alt: ' Vista principal ', confirmation: 'IMPORTAR PNG DE FIGMA' }, request)).resolves.toEqual({ executionHref: '/admin/collections/figma-import-executions/73', mediaHref: '/admin/collections/media/72', placementHref: '/admin/collections/media-placements/71' })
    expect(request).toHaveBeenCalledWith('/api/owner/figma/import-reviews/45/execute', expect.objectContaining({ body: JSON.stringify({ alt: 'Vista principal', confirmation: 'IMPORTAR PNG DE FIGMA' }), credentials: 'same-origin', method: 'POST' }))
  })

  it('rejects malformed inputs and untrusted response destinations', async () => {
    const request = vi.fn()
    await expect(executeFigmaImport('../users', { alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA' }, request)).rejects.toThrow(/identificador/i)
    await expect(executeFigmaImport(45, { alt: '', confirmation: 'IMPORTAR PNG DE FIGMA' }, request)).rejects.toThrow(/alternativo/i)
    await expect(executeFigmaImport(45, { alt: 'Vista', confirmation: 'IMPORTAR' }, request)).rejects.toThrow(/IMPORTAR PNG/i)
    expect(request).not.toHaveBeenCalled()
    const malformed = vi.fn(async () => new Response(JSON.stringify({ execution: { id: '../users', media: 72 } }), { status: 201 }))
    await expect(executeFigmaImport(45, { alt: 'Vista', confirmation: 'IMPORTAR PNG DE FIGMA' }, malformed)).rejects.toThrow(/importar/i)
  })
})
