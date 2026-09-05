import { describe, expect, it, vi } from 'vitest'

import { reviewPublicationBundle } from './client'

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
