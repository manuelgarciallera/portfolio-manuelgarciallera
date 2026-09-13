import { describe, expect, it } from 'vitest'
import { readContactBody } from './contact-body'

describe('bounded contact body', () => {
  it('rejects streamed bytes beyond the limit even without Content-Length', async () => {
    let cancelled = false
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
      start(controller) { controller.enqueue(new Uint8Array(40_001)) },
      cancel() { cancelled = true },
    })
    await expect(readContactBody({ body: stream })).resolves.toEqual({ ok: false, status: 413 })
    expect(cancelled).toBe(true)
  })

  it('counts chunks cumulatively before parsing', async () => {
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({ start(c) {
      c.enqueue(new Uint8Array(20_000)); c.enqueue(new Uint8Array(20_001)); c.close()
    } })
    await expect(readContactBody({ body: stream })).resolves.toEqual({ ok: false, status: 413 })
  })

  it('accepts the maximum permitted message with multibyte characters', async () => {
    const body = { message: '界'.repeat(5000), name: 'Ana', email: 'ana@example.invalid' }
    await expect(readContactBody(new Request('https://example.invalid', { method: 'POST', body: JSON.stringify(body) })))
      .resolves.toEqual({ ok: true, data: body })
  })

  it('rejects missing and malformed JSON bodies', async () => {
    await expect(readContactBody({ body: null })).resolves.toEqual({ ok: false, status: 400 })
    await expect(readContactBody(new Request('https://example.invalid', { method: 'POST', body: '{' })))
      .resolves.toEqual({ ok: false, status: 400 })
  })

  it('accepts the byte boundary and preserves UTF-8 split across chunks', async () => {
    const text = JSON.stringify('é' + 'a'.repeat(39_996))
    const bytes = new TextEncoder().encode(text)
    expect(bytes.byteLength).toBe(40_000)
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({ start(c) {
      c.enqueue(bytes.slice(0, 2)); c.enqueue(bytes.slice(2)); c.close()
    } })
    await expect(readContactBody({ body: stream })).resolves.toEqual({ ok: true, data: 'é' + 'a'.repeat(39_996) })
  })
})
