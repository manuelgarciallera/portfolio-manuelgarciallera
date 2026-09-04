import { describe, expect, it, vi } from 'vitest'

import { createFigmaReadProvider } from './provider'

const source = { fileKey: 'AbC_123-xy', nodeId: '12:34', sourceUrl: 'https://www.figma.com/design/AbC_123-xy?node-id=12-34' }

describe('createFigmaReadProvider', () => {
  it('is disabled without a server token and exposes no write capability', async () => {
    const provider = createFigmaReadProvider({ token: undefined })
    expect(Object.keys(provider)).toEqual(['discover'])
    await expect(provider.discover(source)).resolves.toEqual({ ok: false, code: 'disabled', message: 'Figma discovery is not configured.' })
  })

  it('uses only the official API endpoint and normalizes bounded candidates', async () => {
    const fetchImpl = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({
      name: 'Portfolio',
      lastModified: '2026-09-04T10:00:00Z',
      thumbnailUrl: 'https://s3-alpha.figma.com/thumb.png',
      document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children: [
        { id: '12:34', name: 'Hero', type: 'FRAME', absoluteBoundingBox: { x: 1, y: 2, width: 1440, height: 900 } },
        { id: '12:35', name: 'Button', type: 'COMPONENT', absoluteBoundingBox: { x: 2, y: 3, width: 120, height: 48 } },
        { id: '12:36', name: 'Notes', type: 'TEXT' },
      ] }] },
    }), { headers: { 'content-type': 'application/json' } }))
    const provider = createFigmaReadProvider({ token: 'server-secret', fetchImpl })

    const result = await provider.discover(source)

    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(String(url)).toBe('https://api.figma.com/v1/files/AbC_123-xy?depth=2')
    expect(init).toMatchObject({ redirect: 'error', headers: { 'X-Figma-Token': 'server-secret' } })
    expect(result).toMatchObject({ ok: true, file: { name: 'Portfolio', thumbnail: { url: 'https://s3-alpha.figma.com/thumb.png' } }, candidates: [
      { id: '12:34', name: 'Hero', type: 'FRAME', width: 1440, height: 900 },
      { id: '12:35', name: 'Button', type: 'COMPONENT', width: 120, height: 48 },
    ] })
    expect(JSON.stringify(result)).not.toContain('server-secret')
  })

  it('returns rate-limit metadata without retrying', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 429, headers: { 'retry-after': '3600' } }))
    const result = await createFigmaReadProvider({ token: 'secret', fetchImpl }).discover(source)
    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: false, code: 'rate_limited', message: 'Figma rate limit reached.', retryAfter: '3600' })
  })

  it('caps response size and redacts upstream error content', async () => {
    const oversized = await createFigmaReadProvider({ token: 'secret', maxResponseBytes: 10, fetchImpl: async () => new Response('01234567890') }).discover(source)
    expect(oversized).toEqual({ ok: false, code: 'response_too_large', message: 'Figma response exceeded the configured limit.' })

    const redacted = await createFigmaReadProvider({ token: 'secret', fetchImpl: async () => new Response('token=secret internal detail', { status: 500 }) }).discover(source)
    expect(redacted).toEqual({ ok: false, code: 'upstream_error', message: 'Figma could not complete discovery.' })
    expect(JSON.stringify(redacted)).not.toContain('secret')
  })

  it('aborts a request after the configured timeout', async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const result = await createFigmaReadProvider({ token: 'secret', timeoutMs: 5, fetchImpl }).discover(source)
    expect(result).toEqual({ ok: false, code: 'timeout', message: 'Figma discovery timed out.' })
  })

  it('caps traversed nodes and returned candidates', async () => {
    const children = Array.from({ length: 8 }, (_, index) => ({ id: `1:${index}`, name: `Frame ${index}`, type: 'FRAME', absoluteBoundingBox: { width: 10, height: 20 } }))
    const fetchImpl = async () => new Response(JSON.stringify({ name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children }] } }))
    const result = await createFigmaReadProvider({ token: 'secret', fetchImpl, maxNodes: 5, maxCandidates: 2 }).discover(source)
    expect(result).toMatchObject({ ok: true, candidates: [{ id: '1:0' }, { id: '1:1' }], truncated: true })
  })

  it('does not traverse below the requested Figma depth', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({ name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children: [{
      id: '1:1', name: 'Top frame', type: 'FRAME', children: [{ id: '2:1', name: 'Nested frame', type: 'FRAME' }],
    }] }] } }))
    const result = await createFigmaReadProvider({ token: 'secret', fetchImpl }).discover(source)
    expect(result).toMatchObject({ ok: true, candidates: [{ id: '1:1' }] })
  })
})
