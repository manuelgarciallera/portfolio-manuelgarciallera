import { describe, expect, it, vi } from 'vitest'

import { getOwnerWorkflowSummary } from './workflow-summary-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerWorkflowSummary', () => {
  it('uses owner-scoped counts without loading workflow documents', async () => {
    const count = vi.fn(async () => ({ totalDocs: 0 }))
    await expect(getOwnerWorkflowSummary({ payload: { count }, req: { user: owner } })).resolves.toMatchObject({ attentionCount: 0 })
    expect(count).toHaveBeenCalledTimes(18)
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'assistance-proposals', overrideAccess: false, req: { user: owner }, where: { status: { equals: 'pending' } } }))
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'figma-import-plans', overrideAccess: false, req: { user: owner } }))
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'figma-import-reviews', overrideAccess: false, req: { user: owner } }))
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'figma-import-reviews', where: { decision: { equals: 'approved' } } }))
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'figma-import-executions', overrideAccess: false, req: { user: owner } }))
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'publication-preflights', where: { status: { equals: 'blocked' } } }))
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'publication-preflights', where: { status: { equals: 'ready_with_warnings' } } }))
  })

  it('rejects anonymous access before querying storage', async () => {
    const count = vi.fn()
    await expect(getOwnerWorkflowSummary({ payload: { count }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(count).not.toHaveBeenCalled()
  })
})
