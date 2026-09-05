import { APIError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { handlePrepareRestoreRequest } from './prepare-request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('prepare restore HTTP boundary', () => {
  it('authenticates before parsing or preparing a plan', async () => {
    const prepare = vi.fn()
    const response = await handlePrepareRestoreRequest(new Request('https://owner.test', { body: '{', method: 'POST' }), 44, { authenticate: async () => ({ user: null }), prepare })
    expect(response.status).toBe(403)
    expect(prepare).not.toHaveBeenCalled()
  })

  it('accepts only the explicit preparation phrase and returns the reviewable plan', async () => {
    const prepare = vi.fn(async () => ({ id: 50, status: 'ready' }))
    const response = await handlePrepareRestoreRequest(new Request('https://owner.test', { body: JSON.stringify({ confirmation: 'PREPARAR RESTAURACIÓN' }), method: 'POST' }), 44, { authenticate: async () => ({ user: owner }), prepare })
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ plan: { id: 50, status: 'ready' } })
    expect(prepare).toHaveBeenCalledWith(44, owner)

    const invalid = await handlePrepareRestoreRequest(new Request('https://owner.test', { body: JSON.stringify({ confirmation: 'sí' }), method: 'POST' }), 44, { authenticate: async () => ({ user: owner }), prepare })
    expect(invalid.status).toBe(400)
  })

  it('does not expose service errors', async () => {
    const response = await handlePrepareRestoreRequest(new Request('https://owner.test', { body: JSON.stringify({ confirmation: 'PREPARAR RESTAURACIÓN' }), method: 'POST' }), 44, {
      authenticate: async () => ({ user: owner }),
      prepare: async () => { throw new APIError('postgres token leaked', 500) },
    })
    expect(response.status).toBe(500)
    expect(await response.text()).not.toMatch(/postgres|token|leaked/i)
  })
})
