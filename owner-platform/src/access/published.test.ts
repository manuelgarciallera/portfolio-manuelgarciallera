import { describe, expect, it } from 'vitest'

import { ownerOrPublished, ownerReadVersions } from './published'

const requestFor = (user: unknown) => ({ req: { user } }) as never

describe('published content access', () => {
  it('limits anonymous reads to published documents', () => {
    expect(ownerOrPublished(requestFor(null))).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { deletedAt: { exists: false } },
      ],
    })
  })

  it('lets only the authenticated owner read drafts and versions', () => {
    const owner = { id: 1, collection: 'users', role: 'owner' }

    expect(ownerOrPublished(requestFor(owner))).toBe(true)
    expect(ownerReadVersions(requestFor(owner))).toBe(true)
    expect(ownerReadVersions(requestFor(null))).toBe(false)
  })
})
