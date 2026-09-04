import { describe, expect, it, vi } from 'vitest'

import { getOwnerReleaseSummary } from './summary-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerReleaseSummary', () => {
  it('loads the latest owner-visible releases without expanding unrelated records', async () => {
    const find = vi.fn(async () => ({ docs: [] }))
    await expect(getOwnerReleaseSummary({ payload: { find }, req: { user: owner } })).resolves.toEqual({ count: 0, versions: [] })
    expect(find).toHaveBeenCalledWith({ collection: 'releases', depth: 0, limit: 20, overrideAccess: false, req: { user: owner }, sort: '-createdAt' })
  })

  it('rejects anonymous access before querying storage', async () => {
    const find = vi.fn()
    await expect(getOwnerReleaseSummary({ payload: { find }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(find).not.toHaveBeenCalled()
  })
})
