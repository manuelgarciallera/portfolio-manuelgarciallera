import { describe, expect, it, vi } from 'vitest'

import { getOwnerMediaHealth } from './media-health-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerMediaHealth', () => {
  it('uses owner-scoped counts without loading image documents or binary data', async () => {
    const count = vi.fn(async () => ({ totalDocs: 0 }))
    await expect(getOwnerMediaHealth({ payload: { count }, req: { user: owner } })).resolves.toMatchObject({ issueCount: 0 })
    expect(count).toHaveBeenCalledTimes(11)
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', overrideAccess: false, req: { user: owner }, where: { filesize: { greater_than: 5_242_880 } } }))
  })

  it('rejects anonymous access before querying storage', async () => {
    const count = vi.fn()
    await expect(getOwnerMediaHealth({ payload: { count }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(count).not.toHaveBeenCalled()
  })
})
