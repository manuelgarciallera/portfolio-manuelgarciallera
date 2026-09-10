import { afterEach, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { createOwnerEmailAdapter } from './email'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
const credentials = { apiKey: 're_synthetic_test_key_only', fromAddress: 'cms@example.invalid' }
const initialize = (input: Parameters<typeof createOwnerEmailAdapter>[0]) => createOwnerEmailAdapter(input)({ payload: {} as Payload })

it('refuses missing or partial production configuration', () => {
  for (const input of [{}, { apiKey: credentials.apiKey }, { fromAddress: credentials.fromAddress }]) {
    expect(() => initialize({ ...input, nodeEnv: 'production' })).toThrow(/OWNER_EMAIL/)
  }
})
it.each(['Bad <cms@example.invalid>', 'cms@example.invalid\r\nBcc: other@example.invalid', 'missing-at', ' cms@example.invalid'])('rejects unsafe sender configuration', fromAddress => {
  expect(() => initialize({ ...credentials, fromAddress })).toThrow(/OWNER_EMAIL/)
})
it('does not pretend to deliver without configuration, including isolated build', async () => {
  const fetch = vi.fn(() => { throw new Error('Unexpected network') })
  vi.stubGlobal('fetch', fetch)
  for (const input of [{}, { ...credentials, productionBuild: true, nodeEnv: 'production' }]) {
    await expect(initialize(input).sendEmail({ to: 'owner@example.invalid', subject: 'Reset' })).rejects.toThrow(/not configured/)
  }
  expect(fetch).not.toHaveBeenCalled()
})
it('sends through the fixed provider endpoint with a configured sender', async () => {
  let delivered: unknown
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('authorization')).toBe(`Bearer ${credentials.apiKey}`)
    delivered = JSON.parse(String(init.body))
    return Response.json({ id: 'synthetic-message-id' })
  })
  await expect(initialize(credentials).sendEmail({ from: 'override@example.invalid', to: 'owner@example.invalid', subject: 'Reset', html: '<p>Reset link</p>' })).resolves.toEqual({ id: 'synthetic-message-id' })
  expect(delivered).toMatchObject({ from: 'CMS <cms@example.invalid>', to: 'owner@example.invalid', subject: 'Reset', html: '<p>Reset link</p>' })
})
it('cancels a stalled request after ten seconds', async () => {
  vi.useFakeTimers()
  let signal: AbortSignal | null | undefined
  vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
    signal = init.signal
    return new Promise((_resolve, reject) => signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
  })
  const pending = initialize(credentials).sendEmail({ to: 'owner@example.invalid' })
  expect(signal).toBeInstanceOf(AbortSignal)
  const rejected = expect(pending).rejects.toThrow(/^Owner email delivery failed$/)
  await vi.advanceTimersByTimeAsync(10_000)
  await rejected
  expect(signal?.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})
it('refuses redirects and rejects an error response even if it contains an id', async () => {
  let redirect: RequestRedirect | undefined
  vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
    redirect = init.redirect
    return Response.json({ id: 'not-a-success' }, { status: 500 })
  })
  await expect(initialize(credentials).sendEmail({ to: 'owner@example.invalid' })).rejects.toThrow(/^Owner email delivery failed$/)
  expect(redirect).toBe('error')
})
it('rejects oversized responses instead of buffering them without a limit', async () => {
  vi.stubGlobal('fetch', async () => Response.json({ id: 'x'.repeat(70_000) }))
  await expect(initialize(credentials).sendEmail({ to: 'owner@example.invalid' })).rejects.toThrow(/^Owner email delivery failed$/)
})
it.each([Response.json({ message: 'sensitive-provider-detail', name: 'error', statusCode: 401 }, { status: 401 }), Response.json({ id: '' }), new Response('invalid-json')])('redacts transport failures and rejects missing receipt', async response => {
  vi.stubGlobal('fetch', async () => response)
  await expect(initialize(credentials).sendEmail({ to: 'owner@example.invalid' })).rejects.toThrow(/^Owner email delivery failed$/)
})
