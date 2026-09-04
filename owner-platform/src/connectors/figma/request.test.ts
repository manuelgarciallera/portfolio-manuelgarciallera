import { describe, expect, it, vi } from 'vitest'

import { handleFigmaDiscoverRequest } from './request'

describe('handleFigmaDiscoverRequest', () => {
  it('authenticates before reading an unbounded request body', async () => {
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '5000' }, body: '{invalid' }), {
      authenticate: async () => ({ user: null }),
      discover: vi.fn(),
    })
    expect(response.status).toBe(403)
  })

  it('rejects declared and streamed bodies over the cap', async () => {
    const deps = { authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }), discover: vi.fn() }
    const declared = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '5000' }, body: '{}' }), deps)
    expect(declared.status).toBe(413)
    const streamed = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ source: 'x'.repeat(5000) }) }), deps)
    expect(streamed.status).toBe(413)
  })

  it('parses a valid source and maps a rate limit safely', async () => {
    const discover = vi.fn(async () => ({ ok: false as const, code: 'rate_limited' as const, message: 'Figma rate limit reached.', retryAfter: '60' }))
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ source: 'https://figma.com/design/AbC_123-xy/name' }) }), {
      authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }), discover,
    })
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(discover).toHaveBeenCalledOnce()
  })

  it('redacts unexpected provider failures', async () => {
    const response = await handleFigmaDiscoverRequest(new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ source: 'https://figma.com/design/AbC_123-xy/name' }) }), {
      authenticate: async () => ({ user: { id: 1, collection: 'users', role: 'owner' } }),
      discover: async () => { throw new Error('server-secret') },
    })
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('server-secret')
  })
})
