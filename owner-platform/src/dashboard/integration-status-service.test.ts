import { describe, expect, it, vi } from 'vitest'

import { getOwnerIntegrationStatus } from './integration-status-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerIntegrationStatus', () => {
  it('loads owner-visible switches and projects server configuration', async () => {
    const findGlobal = vi.fn(async () => ({ suggestCopy: true }))
    const result = await getOwnerIntegrationStatus({ environment: { figmaPlan: 'enterprise', figmaToken: 'secret' }, payload: { findGlobal }, req: { user: owner } })
    expect(findGlobal).toHaveBeenCalledWith({ overrideAccess: false, req: { user: owner }, slug: 'assistant-settings' })
    expect(result.connectors.figma).toMatchObject({ configured: true, plan: 'enterprise' })
  })

  it('rejects anonymous access before reading settings', async () => {
    const findGlobal = vi.fn()
    await expect(getOwnerIntegrationStatus({ environment: {}, payload: { findGlobal }, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(findGlobal).not.toHaveBeenCalled()
  })
})
