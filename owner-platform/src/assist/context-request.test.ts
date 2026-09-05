import { APIError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { handleAssistanceContextRequest } from './context-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('assistance context request', () => {
  it('authenticates before loading a bounded snapshot identifier', async () => {
    const load = vi.fn(async () => ({ schemaVersion: 1 }))
    const response = await handleAssistanceContextRequest(new Request('http://local/api/owner/assist/context?sourceSnapshot=12'), {
      authenticate: vi.fn(async () => ({ user: owner })),
      load,
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ contextPackage: { schemaVersion: 1 } })
    expect(load).toHaveBeenCalledWith(12, owner)
  })

  it('rejects anonymous and invalid requests without loading or leaking details', async () => {
    const load = vi.fn()
    const anonymous = await handleAssistanceContextRequest(new Request('http://local/api/owner/assist/context?sourceSnapshot=../users'), { authenticate: vi.fn(async () => ({ user: null })), load })
    expect(anonymous.status).toBe(403)
    expect(load).not.toHaveBeenCalled()

    const invalid = await handleAssistanceContextRequest(new Request('http://local/api/owner/assist/context?sourceSnapshot=../users'), { authenticate: vi.fn(async () => ({ user: owner })), load })
    expect(invalid.status).toBe(400)
    expect(load).not.toHaveBeenCalled()

    const failed = await handleAssistanceContextRequest(new Request('http://local/api/owner/assist/context?sourceSnapshot=12'), { authenticate: vi.fn(async () => ({ user: owner })), load: vi.fn(async () => { throw new APIError('database secret', 500) }) })
    expect(await failed.json()).toEqual({ error: 'Assistance context export failed.' })
  })
})
