import { describe, expect, it, vi } from 'vitest'

import { prepareFigmaImportPlan } from './import-client'

describe('Figma import plan client', () => {
  it('submits the exact confirmation and returns a bounded pending destination', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({ candidateId: '12:34', confirmation: 'PREPARAR IMPORTACIÓN FIGMA', source: 'https://www.figma.com/design/AbCdEf/Portfolio' }))
      return new Response(JSON.stringify({ importPlan: { id: 44, status: 'pending' } }), { status: 201 })
    })
    await expect(prepareFigmaImportPlan('https://www.figma.com/design/AbCdEf/Portfolio', '12:34', request)).resolves.toEqual({ href: '/admin/collections/figma-import-plans/44', id: 44 })
  })

  it('rejects unsafe input before transport and hides malformed server responses', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(prepareFigmaImportPlan('javascript:alert(1)', '12:34', request)).rejects.toThrow(/figma/i)
    await expect(prepareFigmaImportPlan('https://www.figma.com/design/AbCdEf/Portfolio', '../users', request)).rejects.toThrow(/candidato/i)
    expect(request).not.toHaveBeenCalled()
    const malformed = vi.fn(async () => new Response(JSON.stringify({ importPlan: { id: '../users', status: 'pending' } }), { status: 201 }))
    await expect(prepareFigmaImportPlan('https://www.figma.com/design/AbCdEf/Portfolio', '12:34', malformed)).rejects.toThrow('No se pudo preparar la importación de Figma.')
  })
})
