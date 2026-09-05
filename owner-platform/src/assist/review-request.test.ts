import { APIError } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { handleAssistanceReviewRequest } from './review-request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const request = new Request('https://owner.invalid/api/owner/assist/proposals/31')

describe('private assistance comparison request', () => {
  it('serves an authenticated comparison with no-store and without converting string IDs', async () => {
    const load = vi.fn(async () => ({ proposalId: '31', appliesChanges: false }))
    const response = await handleAssistanceReviewRequest(request, '31', { authenticate: async () => ({ user: owner }), load })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ review: { proposalId: '31', appliesChanges: false } })
    expect(load).toHaveBeenCalledWith('31', owner)
  })
  it.each([null, { id: 2, collection: 'users', role: 'visitor' }])('does not load proposals for non-owner sessions', async (user) => {
    const load = vi.fn()
    const response = await handleAssistanceReviewRequest(request, '31', { authenticate: async () => ({ user }), load })
    expect(response.status).toBe(403)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(load).not.toHaveBeenCalled()
  })
  it.each(['../users', 'x'.repeat(65), ''])('rejects unbounded IDs', async (id) => {
    const load = vi.fn()
    const response = await handleAssistanceReviewRequest(request, id, { authenticate: async () => ({ user: owner }), load })
    expect(response.status).toBe(400)
    expect(load).not.toHaveBeenCalled()
  })
  it.each([new APIError('private DB details', 404), new Error('private DB details')])('does not leak errors or cache failure responses', async (error) => {
    const response = await handleAssistanceReviewRequest(request, '31', { authenticate: async () => ({ user: owner }), load: async () => { throw error } })
    expect(response.status).toBe(error instanceof APIError ? 404 : 500)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(JSON.stringify(await response.json())).not.toContain('private DB')
  })
})
