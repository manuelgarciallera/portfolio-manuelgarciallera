import { describe, expect, it, vi } from 'vitest'

import { decideAssistanceProposal } from './client'

describe('assistance proposal decision client', () => {
  it.each([
    ['accepted', 'ACEPTAR PROPUESTA'],
    ['rejected', 'RECHAZAR PROPUESTA'],
  ] as const)('records an explicitly confirmed %s decision', async (decision, confirmation) => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init).toMatchObject({
        body: JSON.stringify({ confirmation, decision, note: 'Revisado.' }),
        credentials: 'same-origin',
        method: 'PATCH',
      })
      return new Response(JSON.stringify({ proposal: { id: 31, status: decision } }), { status: 200 })
    })
    await expect(decideAssistanceProposal(31, { confirmation, decision, note: ' Revisado. ' }, request)).resolves.toEqual({ status: decision })
    expect(request).toHaveBeenCalledWith('/api/owner/assist/proposals/31', expect.any(Object))
  })

  it('rejects mismatched phrases and unsafe identifiers before transport', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(decideAssistanceProposal(31, { confirmation: 'RECHAZAR PROPUESTA', decision: 'accepted' }, request)).rejects.toThrow(/ACEPTAR PROPUESTA/)
    await expect(decideAssistanceProposal('../users', { confirmation: 'ACEPTAR PROPUESTA', decision: 'accepted' }, request)).rejects.toThrow(/identificador/i)
    expect(request).not.toHaveBeenCalled()
  })

  it('hides server and malformed response details', async () => {
    const failed = vi.fn(async () => new Response('postgres token leaked', { status: 500 }))
    await expect(decideAssistanceProposal(31, { confirmation: 'ACEPTAR PROPUESTA', decision: 'accepted' }, failed)).rejects.toThrow('No se pudo registrar la decisión.')
    const malformed = vi.fn(async () => new Response('<html>failure</html>', { status: 200 }))
    await expect(decideAssistanceProposal(31, { confirmation: 'ACEPTAR PROPUESTA', decision: 'accepted' }, malformed)).rejects.toThrow('No se pudo registrar la decisión.')
  })
})
