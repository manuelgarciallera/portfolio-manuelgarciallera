import { describe, expect, it, vi } from 'vitest'

import { getOwnerAuditActivity } from './activity-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerAuditActivity', () => {
  it('loads only the latest owner-visible events without relationship expansion', async () => {
    const find = vi.fn(async () => ({ docs: [] }))
    await expect(getOwnerAuditActivity({ payload: { find }, req: { user: owner } })).resolves.toEqual({ count: 0, events: [] })
    expect(find).toHaveBeenCalledWith({ collection: 'audit-events', depth: 0, limit: 20, overrideAccess: false, req: { user: owner }, sort: '-createdAt' })
  })

  it('rejects anonymous access before querying storage', async () => {
    const find = vi.fn()
    await expect(getOwnerAuditActivity({ payload: { find }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(find).not.toHaveBeenCalled()
  })
})
