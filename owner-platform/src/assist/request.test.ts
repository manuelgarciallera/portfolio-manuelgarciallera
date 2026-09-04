import { APIError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  handleAssistanceDecisionRequest,
  handleAssistanceProposalRequest,
  parseAssistanceDecisionRequest,
  parseAssistanceProposalRequest,
} from './request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const patch = {
  capability: 'suggestCopy',
  operations: [{ op: 'replace', path: '/page/title', value: 'Nuevo título' }],
  schemaVersion: 1,
}

describe('assistance proposal requests', () => {
  it('accepts only snapshot, provider and typed patch input', () => {
    expect(parseAssistanceProposalRequest({ sourceSnapshot: 12, provider: 'codex', patch })).toEqual({
      sourceSnapshot: 12,
      provider: 'codex',
      patch,
    })
    expect(() => parseAssistanceProposalRequest({ sourceSnapshot: 12, provider: 'codex', patch, apiKey: 'secret' })).toThrow(/campo|permitido/i)
    expect(() => parseAssistanceProposalRequest({ sourceSnapshot: '', provider: 'codex', patch })).toThrow(/snapshot/i)
  })

  it('authenticates before parsing and never invokes creation for non-owners', async () => {
    const create = vi.fn()
    const response = await handleAssistanceProposalRequest(
      new Request('https://owner.test/api', { method: 'POST', body: '{bad' }),
      { authenticate: async () => ({ user: null }), create },
    )
    expect(response.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
  })

  it('bounds proposal bodies at 64 KiB and redacts service errors', async () => {
    const dependencies = { authenticate: async () => ({ user: owner }), create: vi.fn() }
    const oversized = await handleAssistanceProposalRequest(
      new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '65537' }, body: '{}' }),
      dependencies,
    )
    expect(oversized.status).toBe(413)
    const failed = await handleAssistanceProposalRequest(
      new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ sourceSnapshot: 12, provider: 'codex', patch }) }),
      { authenticate: async () => ({ user: owner }), create: async () => { throw new APIError('postgres token leaked', 404) } },
    )
    expect(failed.status).toBe(404)
    expect(await failed.text()).not.toMatch(/postgres|token|leaked/i)
  })

  it('passes validated input and authenticated owner to proposal creation', async () => {
    const create = vi.fn(async () => ({ id: 31, status: 'pending' }))
    const response = await handleAssistanceProposalRequest(
      new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify({ sourceSnapshot: 12, provider: 'codex', patch }) }),
      { authenticate: async () => ({ user: owner }), create },
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith({ sourceSnapshot: 12, provider: 'codex', patch }, owner)
  })
})

describe('assistance decision requests', () => {
  it('accepts only one explicit decision and an optional bounded note', () => {
    expect(parseAssistanceDecisionRequest({ decision: 'accepted', note: 'Revisado' })).toEqual({ decision: 'accepted', note: 'Revisado' })
    expect(parseAssistanceDecisionRequest({ decision: 'rejected' })).toEqual({ decision: 'rejected' })
    expect(() => parseAssistanceDecisionRequest({ decision: 'accepted', publish: true })).toThrow(/campo|permitido/i)
    expect(() => parseAssistanceDecisionRequest({ decision: 'accepted', note: 'x'.repeat(1_001) })).toThrow(/nota/i)
  })

  it('authenticates before parsing and decides without exposing apply, publish or deploy controls', async () => {
    const decide = vi.fn(async () => ({ id: 31, status: 'accepted' }))
    const forbidden = await handleAssistanceDecisionRequest(
      new Request('https://owner.test/api/31', { method: 'PATCH', body: '{bad' }),
      31,
      { authenticate: async () => ({ user: null }), decide },
    )
    expect(forbidden.status).toBe(403)
    expect(decide).not.toHaveBeenCalled()

    const accepted = await handleAssistanceDecisionRequest(
      new Request('https://owner.test/api/31', { method: 'PATCH', body: JSON.stringify({ decision: 'accepted', note: 'Revisado' }) }),
      '31',
      { authenticate: async () => ({ user: owner }), decide },
    )
    expect(accepted.status).toBe(200)
    expect(decide).toHaveBeenCalledWith({ decision: 'accepted', note: 'Revisado', proposalId: '31' }, owner)
    expect(JSON.stringify(decide.mock.calls)).not.toMatch(/apply|publish|deploy/)
  })
})
