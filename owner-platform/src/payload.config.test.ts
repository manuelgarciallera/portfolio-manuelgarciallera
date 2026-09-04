import { describe, expect, it } from 'vitest'

import configPromise from './payload.config'

describe('owner Payload configuration', () => {
  it('registers the immutable release registry in the owner application', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('releases')
  })
})
