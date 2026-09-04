import { describe, expect, it, vi } from 'vitest'

import { handleIntegrationStatusRequest } from './integration-status-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('integration status HTTP boundary', () => {
  it('authenticates before loading status', async () => {
    const load = vi.fn()
    const forbidden = await handleIntegrationStatusRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: null }), load })
    expect(forbidden.status).toBe(403)
    expect(load).not.toHaveBeenCalled()
    const response = await handleIntegrationStatusRequest(new Request('https://owner.test/api'), { authenticate: async () => ({ user: owner }), load: async () => ({ connectors: {} }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ integrations: { connectors: {} } })
  })
})
