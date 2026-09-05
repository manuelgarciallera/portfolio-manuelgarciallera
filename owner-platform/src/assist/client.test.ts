import { describe, expect, it, vi } from 'vitest'

import { createAssistanceProposal, decideAssistanceProposal, listAssistanceSnapshots, parseAssistancePatch } from './client'

describe('assistance proposal preparation client', () => {
  it('loads a bounded list of verified preview snapshots', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ docs: [
      { id: 12, sourceDocumentId: 'home', sourceVersionId: 'current:2026-09-05T01:00:00.000Z' },
    ] }), { status: 200 }))
    await expect(listAssistanceSnapshots(request)).resolves.toEqual([{ id: 12, label: 'Página home · 2026-09-05T01:00:00.000Z' }])
    expect(request).toHaveBeenCalledWith(expect.stringContaining('/api/preview-snapshots?'), { credentials: 'same-origin' })
  })

  it('parses a bounded JSON object and creates a pending manual proposal', async () => {
    const patch = parseAssistancePatch('{"schemaVersion":1,"capability":"suggestMotion","operations":[{"op":"replace","path":"/brand/motion/duration","value":800}]}')
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({ patch, provider: 'manual', sourceSnapshot: 12 }))
      return new Response(JSON.stringify({ proposal: { capability: 'suggestMotion', id: 31, status: 'pending' } }), { status: 201 })
    })
    await expect(createAssistanceProposal(12, patch, request)).resolves.toEqual({ capability: 'suggestMotion', id: 31 })
  })

  it('rejects malformed, oversized, unsafe, or inconsistent data without leaking responses', async () => {
    expect(() => parseAssistancePatch('[]')).toThrow(/objeto/i)
    expect(() => parseAssistancePatch(`{"value":"${'x'.repeat(65_536)}"}`)).toThrow(/grande/i)
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(createAssistanceProposal('../users', {}, request)).rejects.toThrow(/snapshot/i)
    expect(request).not.toHaveBeenCalled()
    const malformed = vi.fn(async () => new Response(JSON.stringify({ proposal: { id: 31, status: 'accepted', capability: 'suggestMotion' } }), { status: 201 }))
    await expect(createAssistanceProposal(12, {}, malformed)).rejects.toThrow('No se pudo crear la propuesta.')
  })
})

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
