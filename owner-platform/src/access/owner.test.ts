import { describe, expect, it } from 'vitest'

import { isOwner, ownerOnly } from './owner'

describe('owner access', () => {
  it('accepts only an authenticated Payload user with the owner role', () => {
    expect(isOwner({ id: 1, collection: 'users', role: 'owner' })).toBe(true)
    expect(isOwner({ id: 1, collection: 'users', role: 'editor' })).toBe(false)
    expect(isOwner({ id: 1, collection: 'api-keys', role: 'owner' })).toBe(false)
    expect(isOwner(null)).toBe(false)
  })

  it('denies owner-only access when the request user is absent or malformed', () => {
    expect(ownerOnly({ req: { user: null } } as never)).toBe(false)
    expect(ownerOnly({ req: { user: { role: 'owner' } } } as never)).toBe(false)
    expect(
      ownerOnly({
        req: { user: { id: 'owner-1', collection: 'users', role: 'owner' } },
      } as never),
    ).toBe(true)
  })
})
