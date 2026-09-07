import { NotFound } from 'payload'
import { describe, expect, it } from 'vitest'

import { expectAnonymousDraftNotFound } from './anonymous-draft.mjs'

describe('anonymous draft access proof', () => {
  it('accepts the Payload NotFound response produced by the access filter', async () => {
    await expect(expectAnonymousDraftNotFound(async () => { throw new NotFound() })).resolves.toBeUndefined()
  })

  it('rethrows an unexpected persistence failure instead of counting it as access rejection', async () => {
    const failure = new Error('database unavailable')
    await expect(expectAnonymousDraftNotFound(async () => { throw failure })).rejects.toBe(failure)
  })

  it('fails when anonymous access returns a draft document', async () => {
    await expect(expectAnonymousDraftNotFound(async () => ({ id: 7 }))).rejects.toThrow(/anonymous/i)
  })
})
