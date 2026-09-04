import { describe, expect, it, vi } from 'vitest'

import { getOwnerRecentContent } from './recent-content-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerRecentContent', () => {
  it('loads five lightweight records from each editorial collection', async () => {
    const find = vi.fn(async () => ({ docs: [] }))
    await expect(getOwnerRecentContent({ payload: { find }, req: { user: owner } })).resolves.toEqual({ articles: [], pages: [], projects: [] })
    expect(find).toHaveBeenCalledTimes(3)
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'projects', depth: 0, limit: 5, overrideAccess: false, req: { user: owner }, sort: '-updatedAt', select: { _status: true, slug: true, title: true, updatedAt: true } }))
  })

  it('rejects anonymous access before querying storage', async () => {
    const find = vi.fn()
    await expect(getOwnerRecentContent({ payload: { find }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(find).not.toHaveBeenCalled()
  })
})
