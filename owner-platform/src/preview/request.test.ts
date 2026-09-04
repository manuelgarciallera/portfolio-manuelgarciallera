import { describe, expect, it } from 'vitest'
import { APIError } from 'payload'
import { handlePreviewSnapshotRequest, parsePreviewSnapshotRequest } from './request'

describe('preview snapshot request', () => {
  it('accepts only a pageId and current draft selector', () => {
    expect(parsePreviewSnapshotRequest({ pageId: 7 })).toEqual({ pageId: 7, version: 'current-draft' })
    expect(parsePreviewSnapshotRequest({ pageId: 'home', version: 'current-draft' })).toEqual({ pageId: 'home', version: 'current-draft' })
  })

  it.each([
    {},
    { pageId: 7, sourceDocumentId: 'forged' },
    { pageId: 7, manifest: {} },
    { pageId: 7, version: '123' },
    { pageId: { equals: 7 } },
  ])('rejects forged provenance, content and unsupported selectors %#', (value) => {
    expect(() => parsePreviewSnapshotRequest(value)).toThrow(/solicitud|versión|pageId/i)
  })
})

describe('preview HTTP handler', () => {
  it('authenticates from request headers before parsing and returns 403 without leaking details', async () => {
    let receivedCookie: string | null = null
    const response = await handlePreviewSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', headers: { cookie: 'payload-token=signed' }, body: '{bad' }), {
      authenticate: async (headers) => {
        receivedCookie = headers.get('cookie')
        return { user: null }
      },
      create: async () => { throw new Error('must not run') },
    })
    expect(response.status).toBe(403)
    expect(receivedCookie).toBe('payload-token=signed')
    expect(await response.text()).not.toContain('must not run')
  })

  it('returns 400 for malformed owner input and preserves safe API status without internals', async () => {
    const authenticate = async () => ({ user: { id: 1, collection: 'users', role: 'owner' } })
    const malformed = await handlePreviewSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ pageId: 7, manifest: {} }) }), { authenticate, create: async () => ({}) })
    expect(malformed.status).toBe(400)
    const missing = await handlePreviewSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ pageId: 999 }) }), { authenticate, create: async () => { throw new APIError('Page not found.', 404) } })
    expect(missing.status).toBe(404)
    expect(await missing.text()).not.toMatch(/stack|postgres|secret/i)
  })

  it('rejects declared and chunked oversized bodies with 413 before JSON parsing', async () => {
    const authenticate = async () => ({ user: { id: 1, collection: 'users', role: 'owner' } })
    const declared = await handlePreviewSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '5000' }, body: '{}' }), { authenticate, create: async () => ({}) })
    expect(declared.status).toBe(413)
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(3000)); controller.enqueue(new Uint8Array(3000)); controller.close() } })
    const chunked = await handlePreviewSnapshotRequest(new Request('https://owner.test/api', { method: 'POST', body: stream, duplex: 'half' } as RequestInit), { authenticate, create: async () => ({}) })
    expect(chunked.status).toBe(413)
  })
})
