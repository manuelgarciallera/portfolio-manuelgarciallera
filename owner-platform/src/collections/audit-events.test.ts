import { APIError, type Field } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { AuditEvents, enforceAuditEventDelete, prepareAuditEvent, recordAuditEvent } from './AuditEvents'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const fieldNamed = (name: string): Field | undefined =>
  AuditEvents.fields.find((field) => 'name' in field && field.name === name)

describe('AuditEvents collection', () => {
  it('is service-created, owner-readable and immutable', () => {
    expect(AuditEvents.slug).toBe('audit-events')
    expect(AuditEvents.access?.create?.(accessArgs(owner))).toBe(false)
    expect(AuditEvents.access?.read?.(accessArgs(owner))).toBe(true)
    expect(AuditEvents.access?.read?.(accessArgs(null))).toBe(false)
    expect(AuditEvents.access?.update?.(accessArgs(owner))).toBe(false)
    expect(AuditEvents.access?.delete?.(accessArgs(owner))).toBe(false)
  })

  it('stores actor, action, subject, outcome and bounded metadata only', () => {
    expect(fieldNamed('actor')).toMatchObject({ type: 'relationship', relationTo: 'users', required: true })
    expect(fieldNamed('action')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('subjectCollection')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('subjectId')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('outcome')).toMatchObject({ type: 'select', required: true })
    expect(fieldNamed('metadata')).toMatchObject({ type: 'json', required: true })
    expect(JSON.stringify(AuditEvents.fields)).not.toMatch(/(?:token|password|secret|html|javascript|codeEditor)/i)
  })

  it('records through the server service with normalized immutable data', async () => {
    const create = vi.fn(async ({ data }: { data: unknown }) => ({ id: 9, ...(data as object) }))
    const result = await recordAuditEvent({
      input: {
        action: 'assistant.proposal.created',
        metadata: { capability: 'suggestCopy' },
        outcome: 'success',
        subject: { collection: 'pages', id: 7 },
      },
      payload: { create },
      user: owner,
    })
    expect(create).toHaveBeenCalledWith({
      collection: 'audit-events',
      data: {
        action: 'assistant.proposal.created',
        actor: 1,
        metadata: { capability: 'suggestCopy' },
        outcome: 'success',
        subjectCollection: 'pages',
        subjectId: '7',
      },
      overrideAccess: true,
      user: owner,
    })
    expect(result).toMatchObject({ id: 9, actor: 1 })
  })

  it('rejects updates, deletes, anonymous service calls and malformed persisted events', async () => {
    await expect(prepareAuditEvent({ operation: 'update', data: {}, req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
    await expect(enforceAuditEventDelete({ req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
    await expect(recordAuditEvent({ input: {} as never, payload: { create: vi.fn() }, user: null })).rejects.toBeInstanceOf(APIError)
    await expect(
      prepareAuditEvent({
        operation: 'create',
        data: { action: 'bad', actor: 1, metadata: { token: 'secret' }, outcome: 'success', subjectCollection: 'pages', subjectId: '7' },
        req: { user: owner },
      } as never),
    ).rejects.toBeInstanceOf(APIError)
  })
})
