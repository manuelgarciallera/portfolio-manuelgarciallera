import { describe, expect, it, vi } from 'vitest'

import { listReleaseEvidence, registerOwnerRelease } from './client'

const quality = [{
  accessibility: 98,
  measuredAt: '2026-09-05T05:00:00.000Z',
  performance: 94,
  source: 'lighthouse',
  usability: 96,
  viewport: 'desktop',
}] as const

describe('release registration client', () => {
  it('returns only matching visual and restorable snapshot pairs', async () => {
    const request = vi.fn(async (url: string) => new Response(JSON.stringify({ docs: url.includes('preview-snapshots') ? [
      { createdAt: '2026-09-05T05:00:00.000Z', id: 12, sourceDocumentId: '7', sourceVersionId: 'current:one' },
      { createdAt: '2026-09-04T05:00:00.000Z', id: 14, sourceDocumentId: '8', sourceVersionId: 'current:orphan' },
    ] : [
      { createdAt: '2026-09-05T05:00:01.000Z', id: 13, sourceDocumentId: '7', sourceVersionId: 'current:one' },
    ] }), { status: 200 }))

    await expect(listReleaseEvidence(request)).resolves.toEqual([{
      createdAt: '2026-09-05T05:00:01.000Z',
      draftSnapshot: 13,
      label: 'Página 7 · current:one',
      previewSnapshot: 12,
    }])
  })

  it('fails closed for malformed snapshot responses', async () => {
    const malformed = vi.fn(async () => new Response('<html>failure</html>', { status: 200 }))
    await expect(listReleaseEvidence(malformed)).rejects.toThrow('No se pudieron cargar los snapshots.')
  })

  it('registers bounded evidence through the audited endpoint', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({
        changeSummary: 'Flujo de publicación verificado.',
        confirmation: 'REGISTRAR VERSIÓN',
        draftSnapshot: 13,
        gitCommit: 'a'.repeat(40),
        name: 'Checkpoint editorial',
        previewSnapshot: 12,
        quality,
      }))
      return new Response(JSON.stringify({ release: { id: 44 } }), { status: 201 })
    })
    await expect(registerOwnerRelease({
      changeSummary: ' Flujo de publicación verificado. ',
      confirmation: 'REGISTRAR VERSIÓN',
      draftSnapshot: 13,
      gitCommit: 'a'.repeat(40),
      name: ' Checkpoint editorial ',
      previewSnapshot: 12,
      quality: [...quality],
    }, request)).resolves.toEqual({ href: '/admin/collections/releases/44' })
  })

  it('rejects invalid evidence before transport and hides malformed responses', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(registerOwnerRelease({ changeSummary: 'x', confirmation: 'registrar', draftSnapshot: 13, gitCommit: 'a'.repeat(40), name: 'x', previewSnapshot: 12, quality: [...quality] }, request)).rejects.toThrow(/REGISTRAR VERSIÓN/)
    await expect(registerOwnerRelease({ changeSummary: 'x', confirmation: 'REGISTRAR VERSIÓN', draftSnapshot: 13, gitCommit: 'main', name: 'x', previewSnapshot: 12, quality: [...quality] }, request)).rejects.toThrow(/commit/i)
    expect(request).not.toHaveBeenCalled()
    const malformed = vi.fn(async () => new Response('<html>failure</html>', { status: 201 }))
    await expect(registerOwnerRelease({ changeSummary: 'x', confirmation: 'REGISTRAR VERSIÓN', draftSnapshot: 13, gitCommit: 'a'.repeat(40), name: 'x', previewSnapshot: 12, quality: [...quality] }, malformed)).rejects.toThrow('No se pudo registrar la versión.')
  })
})
