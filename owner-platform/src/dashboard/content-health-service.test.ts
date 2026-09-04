import { describe, expect, it, vi } from 'vitest'

import { getOwnerContentHealth } from './content-health-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerContentHealth', () => {
  it('uses owner-scoped counts and returns a dashboard summary', async () => {
    const count = vi.fn(async ({ collection, where }) => {
      if (where?._status?.equals === 'draft') return { totalDocs: 1 }
      if (where?._status?.equals === 'published') return { totalDocs: 2 }
      if (where) return { totalDocs: 1 }
      return { totalDocs: collection === 'pages' ? 3 : 3 }
    })
    const result = await getOwnerContentHealth({ payload: { count }, req: { user: owner } })
    expect(result.collections.pages).toEqual({ drafts: 1, published: 2, total: 3 })
    expect(result.issueCount).toBe(5)
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'projects', overrideAccess: false, req: { user: owner } }))
    expect(count.mock.calls).toHaveLength(14)
  })

  it('rejects anonymous access before querying', async () => {
    const count = vi.fn()
    await expect(getOwnerContentHealth({ payload: { count }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(count).not.toHaveBeenCalled()
  })
})
