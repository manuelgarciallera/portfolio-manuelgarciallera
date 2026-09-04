import { describe, expect, it, vi } from 'vitest'

import { handleWorkflowSummaryRequest } from './workflow-summary-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('workflow summary HTTP boundary', () => {
  it('authenticates before loading attention counts', async () => {
    const load = vi.fn()
    const forbidden = await handleWorkflowSummaryRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleWorkflowSummaryRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ attentionCount: 2 }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ workflow: { attentionCount: 2 } })
  })
})
