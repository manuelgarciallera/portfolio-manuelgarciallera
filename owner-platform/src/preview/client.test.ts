import { describe, expect, it, vi } from 'vitest'

import { captureSnapshotPair, listSnapshotPages } from './client'

describe('snapshot capture client', () => {
  it('loads a bounded owner page selector', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ docs: [
      { id: 7, slug: 'inicio', title: 'Inicio' },
      { id: 'about', slug: 'sobre-mi', title: 'Sobre mí' },
    ] }), { status: 200 }))
    await expect(listSnapshotPages(request)).resolves.toEqual([
      { id: 7, label: 'Inicio · /inicio' },
      { id: 'about', label: 'Sobre mí · /sobre-mi' },
    ])
    expect(request).toHaveBeenCalledWith('/api/pages?depth=0&limit=100&sort=title&select[id]=true&select[slug]=true&select[title]=true', { credentials: 'same-origin' })
  })

  it('captures matching visual and restorable snapshots from the current draft', async () => {
    const request = vi.fn(async (url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({ pageId: 7, version: 'current-draft' }))
      const snapshot = url.endsWith('/preview-snapshots')
        ? { id: 12, sourceDocumentId: '7', sourceVersionId: 'current:one' }
        : { id: 13, sourceDocumentId: '7', sourceVersionId: 'current:one' }
      return new Response(JSON.stringify({ snapshot }), { status: 201 })
    })
    await expect(captureSnapshotPair(7, request)).resolves.toEqual({ draftSnapshot: 13, previewSnapshot: 12 })
    expect(request.mock.calls.map(([url]) => url)).toEqual(['/api/owner/preview-snapshots', '/api/owner/draft-snapshots'])
  })

  it('rejects mismatched revisions and hides malformed responses', async () => {
    const mismatch = vi.fn(async (url: string) => new Response(JSON.stringify({ snapshot: {
      id: url.endsWith('/preview-snapshots') ? 12 : 13,
      sourceDocumentId: '7',
      sourceVersionId: url.endsWith('/preview-snapshots') ? 'current:one' : 'current:two',
    } }), { status: 201 }))
    await expect(captureSnapshotPair(7, mismatch)).rejects.toThrow(/cambió|coinciden/i)
    const malformed = vi.fn(async () => new Response('<html>failure</html>', { status: 201 }))
    await expect(captureSnapshotPair(7, malformed)).rejects.toThrow('No se pudieron crear los snapshots.')
  })
})
