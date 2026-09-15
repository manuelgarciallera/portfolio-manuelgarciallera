import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { handleFigmaDiscoverRequest } from './request'

describe('handleFigmaDiscoverRequest', () => {
  it('authenticates before reading an unbounded request body', async () => {
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '5000' }, body: '{invalid' }), {
      authenticate: async () => ({ user: null }),
      discover: vi.fn(),
    })
    expect(response.status).toBe(403)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('rejects declared and streamed bodies over the cap', async () => {
    const deps = { authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }), discover: vi.fn() }
    const declared = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '5000' }, body: '{}' }), deps)
    expect(declared.status).toBe(413)
    expect(declared.headers.get('cache-control')).toBe('private, no-store')
    const streamed = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ source: 'x'.repeat(5000) }) }), deps)
    expect(streamed.status).toBe(413)
    expect(streamed.headers.get('cache-control')).toBe('private, no-store')
  })

  it('parses a valid source and maps a rate limit safely', async () => {
    const discover = vi.fn(async () => ({ ok: false as const, code: 'rate_limited' as const, message: 'Figma rate limit reached.', retryAfter: '60' }))
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ source: 'https://figma.com/design/AbC_123-xy/name' }) }), {
      authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }), discover,
    })
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(discover).toHaveBeenCalledOnce()
  })

  it('redacts unexpected provider failures', async () => {
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ source: 'https://figma.com/design/AbC_123-xy/name' }) }), {
      authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }),
      discover: async () => { throw new Error('server-secret') },
    })
    expect(response.status).toBe(502)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).not.toContain('server-secret')
  })

  it('does not allow private file metadata to be stored', async () => {
    const result = { ok: true as const, file: { name: 'Private design' }, candidates: [], truncated: false }
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', {
      method: 'POST', body: JSON.stringify({ source: 'https://figma.com/design/AbC_123-xy/name' }),
    }), {
      authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }),
      discover: async () => result,
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(result)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('marks invalid input responses as non-storable without contacting Figma', async () => {
    let contacted = false
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: '{invalid' }), {
      authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }),
      discover: async () => { contacted = true; throw new Error('Must not contact Figma') },
    })
    expect(response.status).toBe(400)
    expect(contacted).toBe(false)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})
