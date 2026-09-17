import { describe, expect, it, vi } from 'vitest'
import { APIError } from 'payload'

import { handlePublicationExportRequest } from './export-request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const output = { artifactHash: `sha256:${'a'.repeat(64)}`, bundleHash: `sha256:${'b'.repeat(64)}`, exportedAt: '2026-09-05T08:00:00.000Z', hash: `sha256:${'c'.repeat(64)}`, pageCount: 1, pages: [], reviewHash: `sha256:${'d'.repeat(64)}`, schemaVersion: 1 as const }

describe('publication export request', () => {
  it.each([
    { name: 'anonymous', user: null, id: '100', failure: null, status: 403 },
    { name: 'invalid identifier', user: owner, id: '../users', failure: null, status: 400 },
    { name: 'missing artifact', user: owner, id: '100', failure: new APIError('private-export-detail', 404), status: 404 },
    { name: 'integrity conflict', user: owner, id: '100', failure: new APIError('private-export-detail', 409), status: 409 },
    { name: 'service unavailable', user: owner, id: '100', failure: new APIError('private-export-detail', 503), status: 500 },
    { name: 'unexpected failure', user: owner, id: '100', failure: new Error('private-export-detail'), status: 500 },
  ])('never caches private export outcomes: $name', async ({ user, id, failure, status }) => {
    const response = await handlePublicationExportRequest(new Request('https://owner.test/api'), id, {
      authenticate: async () => ({ user }),
      generate: async () => { if (failure) throw failure; return output },
    })
    expect(response.status).toBe(status)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('content-disposition')).toBeNull()
    expect(response.headers.get('x-content-sha256')).toBeNull()
    expect(await response.text()).not.toContain('private-export-detail')
  })
  it('does not cache authentication failures or disclose provider details', async () => {
    const generate = vi.fn()
    const response = await handlePublicationExportRequest(new Request('https://owner.test/api'), '100', {
      authenticate: async () => { throw new Error('private-auth-detail') }, generate,
    })
    expect(response.status).toBe(500)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).not.toContain('private-auth-detail')
    expect(generate).not.toHaveBeenCalled()
  })
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
