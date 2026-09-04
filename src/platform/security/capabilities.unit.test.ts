import { describe, expect, it } from 'vitest'

import {
  authorizeCapability,
  createAuditEvent,
  type Capability,
  type PolicyContext,
} from './capabilities'

const now = '2026-09-04T10:00:00.000Z'

const context = (overrides: Partial<PolicyContext> = {}): PolicyContext => ({
  actor: { id: 'owner-1', kind: 'owner' },
  connector: { id: 'figma', connected: true, enabled: true },
  grants: [{ connectorId: 'figma', capabilities: ['read', 'publish', 'delete', 'deploy', 'changeCode'] }],
  capability: 'read',
  resource: 'file:abc',
  operationDigest: 'digest-1',
  currentTimestamp: now,
  ...overrides,
})

describe('authorizeCapability', () => {
  it('denies by default when no matching grant exists', () => {
    expect(authorizeCapability(context({ grants: [] }))).toEqual({
      allowed: false,
      reason: 'missing_grant',
    })
  })

  it('checks disconnected connectors before grants', () => {
    expect(
      authorizeCapability(
        context({ connector: { id: 'figma', connected: false, enabled: true }, grants: [] }),
      ),
    ).toEqual({ allowed: false, reason: 'connector_disconnected' })
  })

  it('checks disabled connectors after connectivity and before grants', () => {
    expect(
      authorizeCapability(
        context({ connector: { id: 'figma', connected: true, enabled: false }, grants: [] }),
      ),
    ).toEqual({ allowed: false, reason: 'connector_disabled' })
  })

  it('allows a granted ordinary owner capability', () => {
    expect(authorizeCapability(context())).toEqual({ allowed: true, reason: 'allowed' })
  })

  it('categorically denies sensitive capabilities for AI actors', () => {
    const capabilities: Capability[] = ['publish', 'delete', 'deploy']
    for (const capability of capabilities) {
      expect(authorizeCapability(context({ actor: { id: 'agent-1', kind: 'ai' }, capability }))).toEqual({
        allowed: false,
        reason: 'ai_sensitive_action',
      })
    }
  })

  it('requires owner publish approval', () => {
    expect(authorizeCapability(context({ capability: 'publish' }))).toEqual({
      allowed: false,
      reason: 'approval_required',
    })
  })

  it('accepts a current one-time approval bound to the operation digest', () => {
    expect(
      authorizeCapability(
        context({
          capability: 'publish',
          approval: { operationDigest: 'digest-1', expiresAt: '2026-09-04T11:00:00.000Z', used: false },
        }),
      ),
    ).toEqual({ allowed: true, reason: 'allowed' })
  })

  it.each([
    ['used', { operationDigest: 'digest-1', expiresAt: '2026-09-04T11:00:00.000Z', used: true }, 'approval_required'],
    ['expired', { operationDigest: 'digest-1', expiresAt: '2026-09-04T09:59:59.000Z', used: false }, 'approval_expired'],
    ['mismatched', { operationDigest: 'digest-2', expiresAt: '2026-09-04T11:00:00.000Z', used: false }, 'approval_digest_mismatch'],
  ] as const)('denies %s publish approvals', (_name, approval, reason) => {
    expect(authorizeCapability(context({ capability: 'publish', approval }))).toEqual({
      allowed: false,
      reason,
    })
  })

  it('requires isolation before an approval for code changes', () => {
    expect(authorizeCapability(context({ capability: 'changeCode' }))).toEqual({
      allowed: false,
      reason: 'isolation_required',
    })
  })

  it('requires a matching one-time approval in an isolated code context', () => {
    expect(
      authorizeCapability(
        context({
          capability: 'changeCode',
          isolation: { isolated: true },
          approval: { operationDigest: 'digest-1', expiresAt: '2026-09-04T11:00:00.000Z', used: false },
        }),
      ),
    ).toEqual({ allowed: true, reason: 'allowed' })
  })

  it.each([0, null, undefined, 'false'])(
    'fails closed for a non-boolean publish approval used value: %j',
    (used) => {
      expect(
        authorizeCapability(
          context({
            capability: 'publish',
            approval: {
              operationDigest: 'digest-1',
              expiresAt: '2026-09-04T11:00:00.000Z',
              used,
            } as never,
          }),
        ),
      ).toEqual({ allowed: false, reason: 'approval_required' })
    },
  )

  it.each([0, null, undefined, 'false'])(
    'fails closed for a non-boolean code approval used value: %j',
    (used) => {
      expect(
        authorizeCapability(
          context({
            capability: 'changeCode',
            isolation: { isolated: true },
            approval: {
              operationDigest: 'digest-1',
              expiresAt: '2026-09-04T11:00:00.000Z',
              used,
            } as never,
          }),
        ),
      ).toEqual({ allowed: false, reason: 'approval_required' })
    },
  )

  it('rejects blank identifiers and invalid timestamps', () => {
    expect(() => authorizeCapability(context({ resource: '   ' }))).toThrow(TypeError)
    expect(() => authorizeCapability(context({ actor: { id: '', kind: 'owner' } }))).toThrow(TypeError)
    expect(() => authorizeCapability(context({ currentTimestamp: 'not-a-date' }))).toThrow(TypeError)
    expect(() =>
      authorizeCapability(
        context({
          capability: 'publish',
          approval: { operationDigest: ' ', expiresAt: '2026-09-04T11:00:00.000Z', used: false },
        }),
      ),
    ).toThrow(TypeError)
  })

  it('rejects credentials on connector context objects', () => {
    expect(() =>
      authorizeCapability(
        context({
          connector: {
            id: 'figma',
            connected: true,
            enabled: true,
            accessToken: 'must-not-cross-the-boundary',
          } as never,
        }),
      ),
    ).toThrow(/credential|token|secret/i)
  })

  it('rejects non-enumerable connector credentials and all extra connector fields', () => {
    const nonEnumerable = { id: 'figma', connected: true, enabled: true } as Record<string, unknown>
    Object.defineProperty(nonEnumerable, 'accessToken', {
      value: 'must-not-cross-the-boundary',
      enumerable: false,
    })
    expect(() => authorizeCapability(context({ connector: nonEnumerable as never }))).toThrow(TypeError)
    expect(() =>
      authorizeCapability(
        context({
          connector: { id: 'figma', connected: true, enabled: true, label: 'unexpected' } as never,
        }),
      ),
    ).toThrow(TypeError)
  })

  it('rejects inherited connector credentials and accepts a null-prototype connector', () => {
    const inherited = Object.assign(
      Object.create({ accessToken: 'must-not-cross-the-boundary' }),
      { id: 'figma', connected: true, enabled: true },
    )
    expect(() => authorizeCapability(context({ connector: inherited as never }))).toThrow(TypeError)

    const nullPrototype = Object.assign(Object.create(null), {
      id: 'figma',
      connected: true,
      enabled: true,
    })
    expect(authorizeCapability(context({ connector: nullPrototype as never }))).toEqual({
      allowed: true,
      reason: 'allowed',
    })
  })
})

describe('createAuditEvent', () => {
  const input = {
    actor: { id: 'owner-1', kind: 'owner' as const },
    connector: 'figma' as const,
    capability: 'publish' as const,
    resource: 'file:abc',
    result: 'denied' as const,
    reason: 'approval_required' as const,
    timestamp: now,
    correlationId: 'correlation-1',
    metadata: { source: 'panel', attempt: 1, dryRun: true, note: null },
  }

  it('returns an immutable audit event with an ISO timestamp', () => {
    const event = createAuditEvent(input)

    expect(event).toMatchObject(input)
    expect(event.timestamp).toBe(now)
    expect(Object.isFrozen(event)).toBe(true)
    expect(Object.isFrozen(event.actor)).toBe(true)
    expect(Object.isFrozen(event.metadata)).toBe(true)
    expect(() => {
      ;(event as { resource: string }).resource = 'other'
    }).toThrow()
  })

  it('copies JSON-safe scalar metadata without retaining the input object', () => {
    const metadata = { count: 2, enabled: false }
    const event = createAuditEvent({ ...input, metadata })

    expect(event.metadata).toEqual(metadata)
    expect(event.metadata).not.toBe(metadata)
  })

  it.each([
    { nested: { value: 'nope' } },
    { values: ['nope'] },
    { token: 'secret' },
    { clientSecret: 'secret' },
    { password: 'secret' },
    { authorization: 'Bearer secret' },
    { cookie: 'session' },
    { apiKey: 'secret' },
    { count: Number.POSITIVE_INFINITY },
  ])('rejects unsafe metadata %j', (metadata) => {
    expect(() => createAuditEvent({ ...input, metadata } as never)).toThrow(TypeError)
  })

  it('rejects blank IDs, invalid capabilities, and invalid timestamps', () => {
    expect(() => createAuditEvent({ ...input, correlationId: ' ' })).toThrow(TypeError)
    expect(() => createAuditEvent({ ...input, connector: ' ' as never })).toThrow(TypeError)
    expect(() => createAuditEvent({ ...input, capability: 'unknown' as never })).toThrow(TypeError)
    expect(() => createAuditEvent({ ...input, timestamp: 'invalid' })).toThrow(TypeError)
  })

  it('rejects connector credential fields instead of accepting them', () => {
    expect(() =>
      createAuditEvent({
        ...input,
        connector: { id: 'figma', accessToken: 'must-not-cross-the-boundary' } as never,
      }),
    ).toThrow(/credential|token|secret/i)
  })

  it('accepts only public connector state fields at the audit boundary', () => {
    expect(
      createAuditEvent({
        ...input,
        connector: { id: 'figma', connected: true, enabled: true },
      }).connector,
    ).toBe('figma')
  })

  it('rejects non-enumerable connector credentials and all extra audit connector fields', () => {
    const nonEnumerable = { id: 'figma' } as Record<string, unknown>
    Object.defineProperty(nonEnumerable, 'accessToken', {
      value: 'must-not-cross-the-boundary',
      enumerable: false,
    })
    expect(() => createAuditEvent({ ...input, connector: nonEnumerable as never })).toThrow(TypeError)
    expect(() =>
      createAuditEvent({ ...input, connector: { id: 'figma', label: 'unexpected' } as never }),
    ).toThrow(TypeError)
  })

  it('rejects inherited connector credentials and accepts a null-prototype connector', () => {
    const inherited = Object.assign(
      Object.create({ accessToken: 'must-not-cross-the-boundary' }),
      { id: 'figma' },
    )
    expect(() => createAuditEvent({ ...input, connector: inherited as never })).toThrow(TypeError)

    const nullPrototype = Object.assign(Object.create(null), { id: 'figma' })
    expect(createAuditEvent({ ...input, connector: nullPrototype as never }).connector).toBe('figma')
  })
})
