import { describe, expect, it, vi } from 'vitest'

import { searchOwnerContent } from './service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('searchOwnerContent', () => {
  it('searches four owner-visible collections with bounded field selection', async () => {
    const find = vi.fn(async () => ({ docs: [] }))
    await expect(searchOwnerContent({ payload: { find }, query: 'sistema', req: { user: owner } })).resolves.toEqual({ count: 0, results: [] })
    expect(find).toHaveBeenCalledTimes(4)
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'projects', depth: 0, limit: 10, overrideAccess: false, req: { user: owner }, select: { _status: true, slug: true, title: true, updatedAt: true } }))
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', select: { _status: true, alt: true, filename: true, updatedAt: true } }))
  })

  it('rejects anonymous access before querying', async () => {
    const find = vi.fn()
    await expect(searchOwnerContent({ payload: { find }, query: 'test', req: { user: null } })).rejects.toThrow(/owner/i)
    expect(find).not.toHaveBeenCalled()
  })
})
