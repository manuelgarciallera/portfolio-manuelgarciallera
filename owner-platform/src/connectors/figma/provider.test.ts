import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createFigmaReadProvider } from './provider'

const source = { fileKey: 'AbC_123-xy', nodeId: '12:34', sourceUrl: 'https://www.figma.com/design/AbC_123-xy?node-id=12-34' }
const fileSource = { fileKey: 'AbC_123-xy', sourceUrl: 'https://www.figma.com/design/AbC_123-xy' }
const auth = { kind: 'personal-access-token' as const, token: 'server-secret', plan: 'professional' as const }

describe('createFigmaReadProvider', () => {
  it('is disabled without a server token and exposes no write capability', async () => {
    const provider = createFigmaReadProvider({ auth: { kind: 'personal-access-token', token: undefined, plan: 'starter' } })
    expect(Object.keys(provider)).toEqual(['discover'])
    await expect(provider.discover(source)).resolves.toEqual({ ok: false, code: 'disabled', message: 'Figma discovery is not configured.' })
  })

  it('uses only the official API endpoint and normalizes bounded candidates', async () => {
    const fetchImpl = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async (input) => String(input).includes('/images/')
      ? new Response(JSON.stringify({ images: { '12:34': null, '12:35': null } }))
      : new Response(JSON.stringify({
        name: 'Portfolio', lastModified: '2026-09-04T10:00:00Z', thumbnailUrl: 'https://s3-alpha.figma.com/thumb.png',
        nodes: { '12:34': { document: { id: '12:34', name: 'Hero', type: 'FRAME', absoluteBoundingBox: { width: 1440, height: 900 }, children: [
          { id: '12:35', name: 'Button', type: 'COMPONENT', absoluteBoundingBox: { width: 120, height: 48 } }, { id: '12:36', name: 'Notes', type: 'TEXT' },
        ] } } },
      }), { headers: { 'content-type': 'application/json' } }))
    const provider = createFigmaReadProvider({ auth, fetchImpl })

    const result = await provider.discover(source)

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(String(url)).toBe('https://api.figma.com/v1/files/AbC_123-xy/nodes?ids=12%3A34&depth=2')
    expect(init).toMatchObject({ redirect: 'error', headers: { 'X-Figma-Token': 'server-secret' } })
    expect(result).toMatchObject({ ok: true, file: { name: 'Portfolio', thumbnail: { url: 'https://s3-alpha.figma.com/thumb.png' } }, candidates: [
      { id: '12:34', name: 'Hero', type: 'FRAME', width: 1440, height: 900 },
      { id: '12:35', name: 'Button', type: 'COMPONENT', width: 120, height: 48 },
    ] })
    expect(JSON.stringify(result)).not.toContain('server-secret')
  })

  it('returns rate-limit metadata without retrying', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 429, headers: { 'retry-after': '3600' } }))
    const result = await createFigmaReadProvider({ auth, fetchImpl }).discover(source)
    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: false, code: 'rate_limited', message: 'Figma rate limit reached.', retryAfter: '3600' })
  })

  it('caps response size and redacts upstream error content', async () => {
    const oversized = await createFigmaReadProvider({ auth, maxResponseBytes: 10, fetchImpl: async () => new Response('01234567890') }).discover(source)
    expect(oversized).toEqual({ ok: false, code: 'response_too_large', message: 'Figma response exceeded the configured limit.' })

    const redacted = await createFigmaReadProvider({ auth, fetchImpl: async () => new Response('token=secret internal detail', { status: 500 }) }).discover(source)
    expect(redacted).toEqual({ ok: false, code: 'upstream_error', message: 'Figma could not complete discovery.' })
    expect(JSON.stringify(redacted)).not.toContain('secret')
  })

  it('aborts a request after the configured timeout', async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const result = await createFigmaReadProvider({ auth, timeoutMs: 5, fetchImpl }).discover(source)
    expect(result).toEqual({ ok: false, code: 'timeout', message: 'Figma discovery timed out.' })
  })

  it('caps traversed nodes and returned candidates', async () => {
    const children = Array.from({ length: 8 }, (_, index) => ({ id: `1:${index}`, name: `Frame ${index}`, type: 'FRAME', absoluteBoundingBox: { width: 10, height: 20 } }))
    const fetchImpl = async (input: string | URL | Request) => new Response(JSON.stringify(String(input).includes('/images/') ? { images: { '1:0': null, '1:1': null } } : { name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children }] } }))
    const result = await createFigmaReadProvider({ auth, fetchImpl, maxNodes: 5, maxCandidates: 2 }).discover(fileSource)
    expect(result).toMatchObject({ ok: true, candidates: [{ id: '1:0' }, { id: '1:1' }], truncated: true })
  })

  it('does not traverse below the requested Figma depth', async () => {
    const fetchImpl = async (input: string | URL | Request) => new Response(JSON.stringify(String(input).includes('/images/') ? { images: { '1:1': null } } : { name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children: [{
      id: '1:1', name: 'Top frame', type: 'FRAME', children: [{ id: '2:1', name: 'Nested frame', type: 'FRAME' }],
    }] }] } }))
    const result = await createFigmaReadProvider({ auth, fetchImpl }).discover(fileSource)
    expect(result).toMatchObject({ ok: true, candidates: [{ id: '1:1' }] })
  })

  it('uses the whole-file endpoint when no node is selected', async () => {
    const fetchImpl = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [] } })))
    await createFigmaReadProvider({ auth, fetchImpl }).discover(fileSource)
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('https://api.figma.com/v1/files/AbC_123-xy?depth=2')
  })

  it('normalizes the official nodes schema and handles a missing selected node', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ name: 'File', nodes: { '12:34': null } })))
    const result = await createFigmaReadProvider({ auth, fetchImpl }).discover(source)
    expect(result).toMatchObject({ ok: true, candidates: [], selectedNodeMissing: true })
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('fetches candidate previews once in a bounded batch and preserves partial nulls', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/images/')) return new Response(JSON.stringify({ images: { '12:34': 'https://s3-alpha.figma.com/hero.png', '12:35': null } }))
      return new Response(JSON.stringify({ name: 'Portfolio', nodes: { '12:34': { document: { id: '12:34', name: 'Hero', type: 'SECTION', children: [{ id: '12:35', name: 'Child', type: 'FRAME' }] } } } }))
    })
    const result = await createFigmaReadProvider({ auth, fetchImpl, previewScale: 2 }).discover(source)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe('https://api.figma.com/v1/images/AbC_123-xy?ids=12%3A34%2C12%3A35&format=png&scale=2')
    expect(result).toMatchObject({ ok: true, candidates: [
      { id: '12:34', preview: { url: 'https://s3-alpha.figma.com/hero.png', expiresAfterDays: 30 } },
      { id: '12:35', preview: { url: null, expiresAfterDays: 30 } },
    ] })
  })

  it('surfaces a preview rate limit without retrying', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => String(input).includes('/images/')
      ? new Response('{}', { status: 429, headers: { 'retry-after': '120' } })
      : new Response(JSON.stringify({ name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children: [{ id: '1:1', name: 'Hero', type: 'FRAME' }] }] } })))
    const result = await createFigmaReadProvider({ auth, fetchImpl }).discover(fileSource)
    expect(result).toEqual({ ok: false, code: 'rate_limited', message: 'Figma rate limit reached.', retryAfter: '120', stage: 'previews' })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('rejects non-HTTPS preview URLs returned by the upstream response', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => String(input).includes('/images/')
      ? new Response(JSON.stringify({ images: { '1:1': 'http://attacker.test/image.png' } }))
      : new Response(JSON.stringify({ name: 'File', document: { id: '0:0', type: 'DOCUMENT', children: [{ id: '0:1', type: 'CANVAS', children: [{ id: '1:1', name: 'Hero', type: 'FRAME' }] }] } })))
    const result = await createFigmaReadProvider({ auth, fetchImpl }).discover(fileSource)
    expect(result).toEqual({ ok: false, code: 'invalid_response', message: 'Figma returned an invalid response.', stage: 'previews' })
  })
})
