import { describe, expect, it, vi } from 'vitest'

import { generatePublicationArtifact, listPublicationCandidates, preparePublicationBundle, reorderPublicationSelection, reviewPublicationBundle } from './client'

describe('publication bundle preparation client', () => {
  it('loads a bounded list of immutable release candidates', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({
      docs: [
        { changeSummary: 'Primera versión.', createdAt: '2026-09-05T08:00:00.000Z', id: 44, name: 'Versión uno' },
        { changeSummary: 'Segunda versión.', createdAt: '2026-09-04T08:00:00.000Z', id: 'release_45', name: 'Versión dos' },
      ],
    }), { status: 200 }))

    await expect(listPublicationCandidates(request)).resolves.toEqual([
      { changeSummary: 'Primera versión.', createdAt: '2026-09-05T08:00:00.000Z', id: 44, name: 'Versión uno' },
      { changeSummary: 'Segunda versión.', createdAt: '2026-09-04T08:00:00.000Z', id: 'release_45', name: 'Versión dos' },
    ])
    expect(request).toHaveBeenCalledWith('/api/releases?depth=0&limit=100&sort=-createdAt', { credentials: 'same-origin' })
  })

  it('rejects malformed candidate data instead of rendering it', async () => {
    const malformed = vi.fn(async () => new Response(JSON.stringify({ docs: [{ id: '../users', name: 'X', changeSummary: 'Y', createdAt: 'bad' }] }), { status: 200 }))
    await expect(listPublicationCandidates(malformed)).rejects.toThrow('No se pudieron cargar las versiones.')
  })

  it('requires the exact phrase and creates a reviewable immutable bundle', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({ confirmation: 'PREPARAR PUBLICACIÓN', name: 'Entrega septiembre', releaseIds: [44, 'release_45'] }))
      return new Response(JSON.stringify({ bundle: { id: 80 } }), { status: 201 })
    })

    await expect(preparePublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: ' Entrega septiembre ', releaseIds: [44, 'release_45'] }, request)).resolves.toEqual({ href: '/admin/collections/publication-bundles/80' })
    await expect(preparePublicationBundle({ confirmation: 'publicar', name: 'Entrega', releaseIds: [44] }, request)).rejects.toThrow(/PREPARAR PUBLICACIÓN/)
    expect(request).toHaveBeenCalledOnce()
  })

  it('rejects empty, duplicate or unsafe selections before transport', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(preparePublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: '', releaseIds: [44] }, request)).rejects.toThrow(/nombre/i)
    await expect(preparePublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: 'Entrega', releaseIds: [] }, request)).rejects.toThrow(/versiones/i)
    await expect(preparePublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: 'Entrega', releaseIds: [44, 44] }, request)).rejects.toThrow(/duplic/i)
    await expect(preparePublicationBundle({ confirmation: 'PREPARAR PUBLICACIÓN', name: 'Entrega', releaseIds: ['../users'] }, request)).rejects.toThrow(/identificador/i)
    expect(request).not.toHaveBeenCalled()
  })

  it('moves a selected version by one position without mutating the source order', () => {
    const source = [44, 45, 46]
    expect(reorderPublicationSelection(source, 46, -1)).toEqual([44, 46, 45])
    expect(reorderPublicationSelection(source, 44, -1)).toEqual(source)
    expect(source).toEqual([44, 45, 46])
  })
})

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
