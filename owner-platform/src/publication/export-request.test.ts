import { describe, expect, it, vi } from 'vitest'

import { handlePublicationExportRequest } from './export-request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const output = { artifactHash: `sha256:${'a'.repeat(64)}`, bundleHash: `sha256:${'b'.repeat(64)}`, exportedAt: '2026-09-05T08:00:00.000Z', hash: `sha256:${'c'.repeat(64)}`, pageCount: 1, pages: [], reviewHash: `sha256:${'d'.repeat(64)}`, schemaVersion: 1 as const }

describe('publication export request', () => {
  it('authenticates before generating a no-store JSON attachment with integrity metadata', async () => {
    const generate = vi.fn(async () => output)
    const request = new Request('http://owner.test')
    const denied = await handlePublicationExportRequest(request, 100, { authenticate: async () => ({ user: null }), generate })
    expect(denied.status).toBe(403)
    expect(generate).not.toHaveBeenCalled()
    const response = await handlePublicationExportRequest(request, 100, { authenticate: async () => ({ user: owner }), generate })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="portfolio-export-100.json"')
    expect(response.headers.get('x-content-sha256')).toBe(output.hash)
    await expect(response.json()).resolves.toEqual(output)
  })

  it('rejects unsafe identifiers without invoking the export service', async () => {
    const generate = vi.fn()
    const response = await handlePublicationExportRequest(new Request('http://owner.test'), '../users', { authenticate: async () => ({ user: owner }), generate })
    expect(response.status).toBe(400)
    expect(generate).not.toHaveBeenCalled()
  })
})
