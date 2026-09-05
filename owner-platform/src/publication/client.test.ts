import { describe, expect, it, vi } from 'vitest'

import { generatePublicationArtifact, reviewPublicationBundle } from './client'

describe('publication review client', () => {
  it.each([
    ['approved', 'APROBAR PAQUETE'],
    ['rejected', 'RECHAZAR PAQUETE'],
  ] as const)('records an explicit %s decision and returns its immutable review', async (decision, confirmation) => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({ confirmation, decision, note: 'Revisado.' }))
      return new Response(JSON.stringify({ review: { id: 70, decision } }), { status: 201 })
    })
    await expect(reviewPublicationBundle(80, { confirmation, decision, note: ' Revisado. ' }, request)).resolves.toEqual({ decision, href: '/admin/collections/publication-reviews/70' })
  })

  it('rejects a mismatched phrase before transport', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(reviewPublicationBundle(80, { confirmation: 'APROBAR PAQUETE', decision: 'rejected' }, request)).rejects.toThrow(/RECHAZAR PAQUETE/)
    expect(request).not.toHaveBeenCalled()
  })

  it('hides server errors and rejects unsafe response identifiers', async () => {
    const failed = vi.fn(async () => new Response('postgres token leaked', { status: 500 }))
    await expect(reviewPublicationBundle(80, { confirmation: 'APROBAR PAQUETE', decision: 'approved' }, failed)).rejects.toThrow('No se pudo registrar la revisión.')
    const malformed = vi.fn(async () => new Response(JSON.stringify({ review: { id: '../users', decision: 'approved' } }), { status: 201 }))
    await expect(reviewPublicationBundle(80, { confirmation: 'APROBAR PAQUETE', decision: 'approved' }, malformed)).rejects.toThrow('No se pudo registrar la revisión.')
  })
})

describe('publication artifact client', () => {
  it('requires the exact phrase and returns the immutable artifact destination', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init).toMatchObject({ body: JSON.stringify({ confirmation: 'GENERAR ARTEFACTO' }), credentials: 'same-origin', method: 'POST' })
      return new Response(JSON.stringify({ artifact: { id: 91 } }), { status: 201 })
    })
    await expect(generatePublicationArtifact(70, 'GENERAR ARTEFACTO', request)).resolves.toEqual({ href: '/admin/collections/publication-artifacts/91' })
    await expect(generatePublicationArtifact(70, 'generar', request)).rejects.toThrow(/GENERAR ARTEFACTO/)
    expect(request).toHaveBeenCalledOnce()
  })

  it('hides failures and rejects an unsafe artifact identifier', async () => {
    const failed = vi.fn(async () => new Response('secret leaked', { status: 500 }))
    await expect(generatePublicationArtifact(70, 'GENERAR ARTEFACTO', failed)).rejects.toThrow('No se pudo generar el artefacto.')
    const malformed = vi.fn(async () => new Response(JSON.stringify({ artifact: { id: '../users' } }), { status: 201 }))
    await expect(generatePublicationArtifact(70, 'GENERAR ARTEFACTO', malformed)).rejects.toThrow('No se pudo generar el artefacto.')
  })
})
