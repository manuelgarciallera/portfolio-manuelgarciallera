import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { downloadFigmaRender } from './render-download'

describe('downloadFigmaRender', () => {
  it('downloads a bounded PNG from an approved Figma render host without credentials or redirects', async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { 'content-length': '4', 'content-type': 'image/png' },
      status: 200,
    }))

    const result = await downloadFigmaRender('https://api-cdn.figma.com/resize/thumbnails/example.png?token=temporary', { fetchImpl })

    expect(result).toEqual({ data: Buffer.from([137, 80, 78, 71]), mimeType: 'image/png', size: 4 })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api-cdn.figma.com/resize/thumbnails/example.png?token=temporary',
      expect.objectContaining({ credentials: 'omit', method: 'GET', redirect: 'error' }),
    )
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/figma-token|authorization/i)
  })

  it.each([
    'http://api-cdn.figma.com/image.png',
    'https://api-cdn.figma.com.evil.example/image.png',
    'https://user:secret@api-cdn.figma.com/image.png',
    'https://api-cdn.figma.com:8443/image.png',
    'https://example.com/image.png',
  ])('rejects an unsafe render URL before making a request: %s', async (url) => {
    const fetchImpl = vi.fn()
    await expect(downloadFigmaRender(url, { fetchImpl })).rejects.toThrow(/URL|Figma/i)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejects redirects, non-PNG responses, declared oversize files, and streamed files over the cap', async () => {
    await expect(downloadFigmaRender('https://s3-alpha.figma.com/a', { fetchImpl: async () => new Response(null, { headers: { location: 'https://example.com' }, status: 302 }) })).rejects.toThrow(/descargar/i)
    await expect(downloadFigmaRender('https://s3-alpha-sig.figma.com/a', { fetchImpl: async () => new Response('svg', { headers: { 'content-type': 'image/svg+xml' } }) })).rejects.toThrow(/PNG/i)
    await expect(downloadFigmaRender('https://figma-alpha-api.s3.us-west-2.amazonaws.com/a', { fetchImpl: async () => new Response('large', { headers: { 'content-length': '6', 'content-type': 'image/png' } }), maxBytes: 5 })).rejects.toThrow(/tamaño/i)
    await expect(downloadFigmaRender('https://api-cdn.figma.com/a', { fetchImpl: async () => new Response('streamed', { headers: { 'content-type': 'image/png' } }), maxBytes: 5 })).rejects.toThrow(/tamaño/i)
  })

  it('rejects empty responses and aborts requests after the bounded timeout', async () => {
    await expect(downloadFigmaRender('https://api-cdn.figma.com/a', { fetchImpl: async () => new Response('', { headers: { 'content-type': 'image/png' } }) })).rejects.toThrow(/vacía/i)
    const timeout = Object.assign(new Error('timeout'), { name: 'TimeoutError' })
    await expect(downloadFigmaRender('https://api-cdn.figma.com/a', { fetchImpl: async () => { throw timeout }, timeoutMs: 1 })).rejects.toThrow(/tiempo/i)
  })
})
