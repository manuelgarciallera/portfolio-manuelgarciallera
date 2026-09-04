import { describe, expect, it, vi } from 'vitest'

import { handleReleaseRequest, parseReleaseRequest } from './request'

const owner = { id: 1, collection: 'users', role: 'owner' }
const valid = {
  changeSummary: 'Nueva API owner.',
  draftSnapshot: 13,
  gitCommit: 'a'.repeat(40),
  name: 'API owner',
  previewSnapshot: 12,
  quality: [{
    accessibility: 98,
    measuredAt: '2026-09-04T22:00:00.000Z',
    performance: 96,
    source: 'lighthouse',
    usability: 97,
    viewport: 'desktop',
  }],
}

describe('release registration request', () => {
  it('accepts only immutable release evidence fields', () => {
    expect(parseReleaseRequest(valid)).toEqual(valid)
    expect(() => parseReleaseRequest({ ...valid, restore: true })).toThrow(/campo|permitido/i)
    expect(() => parseReleaseRequest({ ...valid, createdBy: 99 })).toThrow(/campo|permitido/i)
  })

  it('authenticates before parsing and bounds request bodies', async () => {
    const create = vi.fn()
    const forbidden = await handleReleaseRequest(
      new Request('https://owner.test/api', { method: 'POST', body: '{bad' }),
      { authenticate: async () => ({ user: null }), create },
    )
    expect(forbidden.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
    const oversized = await handleReleaseRequest(
      new Request('https://owner.test/api', { method: 'POST', headers: { 'content-length': '16385' }, body: '{}' }),
      { authenticate: async () => ({ user: owner }), create },
    )
    expect(oversized.status).toBe(413)
  })

  it('passes validated evidence to the release service without restore controls', async () => {
    const create = vi.fn(async () => ({ id: 44, ...valid }))
    const response = await handleReleaseRequest(
      new Request('https://owner.test/api', { method: 'POST', body: JSON.stringify(valid) }),
      { authenticate: async () => ({ user: owner }), create },
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(valid, owner)
    expect(JSON.stringify(create.mock.calls)).not.toMatch(/restore|apply|publish|deploy/)
  })
})
