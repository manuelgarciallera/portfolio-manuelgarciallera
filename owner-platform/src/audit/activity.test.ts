import { describe, expect, it } from 'vitest'

import { buildAuditActivity } from './activity'

describe('buildAuditActivity', () => {
  it('returns bounded dashboard events without actor or metadata payloads', () => {
    const result = buildAuditActivity([{
      id: 8,
      action: 'release.registered',
      actor: { id: 1, email: 'owner@example.test' },
      metadata: { gitCommit: 'a'.repeat(40) },
      outcome: 'success',
      subjectCollection: 'releases',
      subjectId: '7',
      createdAt: '2026-09-05T09:00:00.000Z',
    }])
    expect(result).toEqual({ count: 1, events: [{ id: 8, action: 'release.registered', outcome: 'success', subject: { collection: 'releases', id: '7' }, createdAt: '2026-09-05T09:00:00.000Z' }] })
    expect(JSON.stringify(result)).not.toMatch(/owner@example|gitCommit|metadata|actor/)
  })

  it('rejects malformed events rather than presenting misleading history', () => {
    expect(() => buildAuditActivity([{ id: 1, action: 'bad', outcome: 'success', subjectCollection: 'pages', subjectId: '2', createdAt: '2026-09-05T09:00:00.000Z' }])).toThrow(/acción/i)
    expect(() => buildAuditActivity([{ id: 1, action: 'page.updated', outcome: 'maybe', subjectCollection: 'pages', subjectId: '2', createdAt: '2026-09-05T09:00:00.000Z' }])).toThrow(/resultado/i)
  })
})
