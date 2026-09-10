import { afterEach, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { createOwnerEmailAdapter } from './email'

afterEach(() => vi.unstubAllGlobals())
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
it('sends through the official adapter with a fixed configured sender', async () => {
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
it.each([Response.json({ message: 'sensitive-provider-detail', name: 'error', statusCode: 401 }, { status: 401 }), Response.json({ id: '' }), new Response('invalid-json')])('redacts transport failures and rejects missing receipt', async response => {
  vi.stubGlobal('fetch', async () => response)
  await expect(initialize(credentials).sendEmail({ to: 'owner@example.invalid' })).rejects.toThrow(/^Owner email delivery failed$/)
})
