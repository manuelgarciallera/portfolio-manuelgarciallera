import { describe, expect, it } from 'vitest'

import { createAuditEventData } from './event'

describe('createAuditEventData', () => {
  it('creates a detached, bounded event with explicit actor and subject provenance', () => {
    const metadata = { capability: 'suggestCopy', paths: ['/page/title'] }
    const result = createAuditEventData(
      {
        action: 'assistant.proposal.created',
        metadata,
        outcome: 'success',
        subject: { collection: 'pages', id: '7' },
      },
      { id: 1 },
    )
    metadata.paths[0] = '/forged'
    expect(result).toEqual({
      action: 'assistant.proposal.created',
      actor: 1,
      metadata: { capability: 'suggestCopy', paths: ['/page/title'] },
      outcome: 'success',
      subjectCollection: 'pages',
      subjectId: '7',
    })
  })

  it.each([
    { action: 'publish<script>', outcome: 'success', subject: { collection: 'pages', id: '7' } },
    { action: 'page.updated', outcome: 'done', subject: { collection: 'pages', id: '7' } },
    { action: 'page.updated', outcome: 'success', subject: { collection: '../users', id: '7' } },
    { action: 'page.updated', outcome: 'success', subject: { collection: 'pages', id: '' } },
  ])('rejects ambiguous event provenance %#', (input) => {
    expect(() => createAuditEventData(input as never, { id: 1 })).toThrow()
  })

  it.each<[unknown]>([
    [{ token: 'secret' }],
    [{ nested: { password: 'secret' } }],
    [{ html: '<script />' }],
    [{ constructor: 'pollute' }],
    [{ command: 'git reset --hard' }],
    [{ huge: 'x'.repeat(4001) }],
  ])('rejects secret, executable, prototype or unbounded metadata %#', (metadata) => {
    expect(() =>
      createAuditEventData(
        {
          action: 'page.updated',
          metadata,
          outcome: 'success',
          subject: { collection: 'pages', id: '7' },
        },
        { id: 1 },
      ),
    ).toThrow()
  })

  it('requires a concrete authenticated actor', () => {
    expect(() =>
      createAuditEventData(
        {
          action: 'page.updated',
          outcome: 'denied',
          subject: { collection: 'pages', id: '7' },
        },
        { id: null },
      ),
    ).toThrow(/actor/i)
  })
})
