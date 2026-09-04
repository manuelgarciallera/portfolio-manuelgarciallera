import { describe, expect, it } from 'vitest'

import { getOwnerReadiness } from './readiness-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerReadiness', () => {
  it('returns a credential-free runtime projection to the owner', () => {
    expect(getOwnerReadiness({ environment: { nodeEnv: 'development' }, user: owner })).toMatchObject({ productionReady: false })
  })

  it('rejects anonymous access', () => {
    expect(() => getOwnerReadiness({ environment: {}, user: null })).toThrow(/owner/i)
  })
})
