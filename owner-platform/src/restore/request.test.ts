import { describe, expect, it, vi } from 'vitest'

import {
  handleRestoreConfirmationRequest,
  handleRestorePlanRequest,
  parseRestoreConfirmationRequest,
  parseRestorePlanRequest,
} from './request'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('restore plan HTTP boundary', () => {
  it('accepts only the first-confirmation plan fields', () => {
    expect(parseRestorePlanRequest({
      baselineSnapshot: 12,
      confirmation: 'PREPARAR RESTAURACIÓN',
      releaseId: 44,
    })).toEqual({ baselineSnapshot: 12, confirmation: 'PREPARAR RESTAURACIÓN', releaseId: 44 })
    expect(() => parseRestorePlanRequest({ baselineSnapshot: 12, confirmation: 'PREPARAR RESTAURACIÓN', releaseId: 44, execute: true })).toThrow(/campo|permitido/i)
  })

  it('authenticates before parsing and creates no plan for non-owners', async () => {
    const create = vi.fn()
    const response = await handleRestorePlanRequest(
      new Request('https://owner.test/api', { method: 'POST', body: '{bad' }),
      { authenticate: async () => ({ user: null }), create },
    )
    expect(response.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
  })

  it('requires a second exact confirmation and never exposes execution', async () => {
    expect(parseRestoreConfirmationRequest({
      confirmation: 'CONFIRMAR RESTAURACIÓN',
      currentSnapshot: 13,
    })).toEqual({ confirmation: 'CONFIRMAR RESTAURACIÓN', currentSnapshot: 13 })
    expect(() => parseRestoreConfirmationRequest({ confirmation: 'CONFIRMAR RESTAURACIÓN', currentSnapshot: 13, restore: true })).toThrow(/campo|permitido/i)
    const confirm = vi.fn(async () => ({ id: 50, status: 'confirmed' }))
    const response = await handleRestoreConfirmationRequest(
      new Request('https://owner.test/api/50', { method: 'PATCH', body: JSON.stringify({ confirmation: 'CONFIRMAR RESTAURACIÓN', currentSnapshot: 13 }) }),
      50,
      { authenticate: async () => ({ user: owner }), confirm },
    )
    expect(response.status).toBe(200)
    expect(confirm).toHaveBeenCalledWith({ confirmation: 'CONFIRMAR RESTAURACIÓN', currentSnapshot: 13, planId: 50 }, owner)
    expect(JSON.stringify(confirm.mock.calls)).not.toMatch(/execute|apply|publish|deploy/)
  })

  it('limits both bodies before service invocation', async () => {
    const create = vi.fn()
    const response = await handleRestorePlanRequest(
      new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '4097' }, body: '{}' }),
      { authenticate: async () => ({ user: owner }), create },
    )
    expect(response.status).toBe(413)
    expect(create).not.toHaveBeenCalled()
  })
})
