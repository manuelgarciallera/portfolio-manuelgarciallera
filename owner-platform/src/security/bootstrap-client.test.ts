import { describe, expect, it, vi } from 'vitest'
import { registerFirstOwner } from './bootstrap-client'

const input = { email: 'owner@example.invalid', password: 'A-strong-test-password!', confirmation: 'A-strong-test-password!', bootstrapSecret: 'test-installation-key-with-at-least-32-characters' }

describe('guided owner installation', () => {
  it('submits only to the protected same-origin endpoint without storing the installation key in content', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    await registerFirstOwner(input, fetcher)
    const [url, options] = fetcher.mock.calls[0]
    expect(url).toBe('/api/users/first-register')
    expect(options.credentials).toBe('same-origin')
    expect(options.headers['x-owner-bootstrap-secret']).toBe(input.bootstrapSecret)
    expect(JSON.parse(options.body)).toEqual({ email: input.email, password: input.password, role: 'owner' })
    expect(options.body).not.toContain(input.bootstrapSecret)
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
  it.each([
    { confirmation: 'different' }, { password: 'short', confirmation: 'short' },
    { bootstrapSecret: '' }, { bootstrapSecret: 'x'.repeat(257) }, { email: 'invalid' },
  ])('rejects invalid input before contacting the server: %j', async (changes) => {
    const fetcher = vi.fn()
    await expect(registerFirstOwner({ ...input, ...changes }, fetcher)).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([403, 400, 409, 500])('reports an actionable, sanitized server failure (%s)', async (status) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(input.bootstrapSecret, { status }))
    await expect(registerFirstOwner(input, fetcher)).rejects.toThrow(/instalación|datos|cuenta|servidor/i)
    await expect(registerFirstOwner(input, fetcher)).rejects.not.toThrow(input.bootstrapSecret)
  })
  it('does not echo network errors that could contain credentials', async () => {
    await expect(registerFirstOwner(input, vi.fn().mockRejectedValue(new Error(input.bootstrapSecret))))
      .rejects.toThrow('No se pudo contactar con el servidor. Comprueba la conexión y vuelve a intentarlo.')
  })
})
