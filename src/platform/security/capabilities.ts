/** Pure connector authorization and audit contracts for the private owner platform. */

export type ConnectorId = 'figma' | 'openai' | 'codex' | (string & {})

export type Capability =
  | 'read'
  | 'import'
  | 'propose'
  | 'editDraft'
  | 'publish'
  | 'delete'
  | 'changeCode'
  | 'deploy'
  | 'replacePublishedAsset'

export type ReasonCode =
  | 'allowed'
  | 'connector_disconnected'
  | 'connector_disabled'
  | 'missing_grant'
  | 'ai_sensitive_action'
  | 'approval_required'
  | 'approval_expired'
  | 'approval_digest_mismatch'
  | 'isolation_required'

export type TimestampInput = string | Date

export interface ConnectorGrant {
  connectorId: ConnectorId
  capabilities: readonly Capability[]
}

export interface ApprovalEvidence {
  operationDigest: string
  expiresAt: TimestampInput
  used: boolean
}

export interface IsolationEvidence {
  isolated: boolean
}

export interface PolicyContext {
  actor: { id: string; kind: 'owner' | 'ai' }
  connector: { id: ConnectorId; connected: boolean; enabled: boolean }
  grants: readonly ConnectorGrant[]
  capability: Capability
  resource: string
  /** Digest of the exact operation being authorized. */
  operationDigest?: string
  /** The current time used for expiry checks. `now` is accepted as a compatibility alias. */
  currentTimestamp?: TimestampInput
  now?: TimestampInput
  approval?: ApprovalEvidence
  isolation?: IsolationEvidence
  /** Compatibility shorthand for callers that already have an isolated-run flag. */
  isolatedExecution?: boolean
}

export interface AuthorizationDecision {
  allowed: boolean
  reason: ReasonCode
}

export type AuditResult = boolean

export interface AuditEventInput {
  actor: { id: string; kind: 'owner' | 'ai' }
  connector: ConnectorId | { id: ConnectorId; connected?: boolean; enabled?: boolean }
  capability: Capability
  resource: string
  /** The authorization outcome is the sole source for the recorded result and reason. */
  decision: AuthorizationDecision
  timestamp: TimestampInput
  correlationId: string
  metadata?: Readonly<Record<string, string | number | boolean | null>>
}

export interface AuditEvent {
  readonly actor: Readonly<{ id: string; kind: 'owner' | 'ai' }>
  readonly connector: ConnectorId
  readonly capability: Capability
  readonly resource: string
  readonly result: AuditResult
  readonly reason: ReasonCode
  readonly timestamp: string
  readonly correlationId: string
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>
}

const CAPABILITIES: readonly Capability[] = [
  'read',
  'import',
  'propose',
  'editDraft',
  'publish',
  'delete',
  'changeCode',
  'deploy',
  'replacePublishedAsset',
]

const SECRET_KEY = /token|secret|password|authorization|cookie|key/i
const CONNECTOR_PUBLIC_KEYS = ['id', 'connected', 'enabled'] as const
const AUDIT_EVENT_INPUT_KEYS = [
  'actor',
  'connector',
  'capability',
  'resource',
  'decision',
  'timestamp',
  'correlationId',
  'metadata',
] as const
const APPROVAL_REQUIRED_CAPABILITIES = new Set<Capability>([
  'publish',
  'delete',
  'deploy',
  'replacePublishedAsset',
])
const REASON_CODES: readonly ReasonCode[] = [
  'allowed',
  'connector_disconnected',
  'connector_disabled',
  'missing_grant',
  'ai_sensitive_action',
  'approval_required',
  'approval_expired',
  'approval_digest_mismatch',
  'isolation_required',
]

const assertExactOwnProperties = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  label: string,
): void => {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string') {
      throw new TypeError(`${label} must not contain symbol keys.`)
    }
    if (!allowedKeys.includes(key)) {
      throw new TypeError(`${label} contains unsupported field "${key}".`)
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const requireNonBlank = (value: unknown, label: string): string => {
  if (!isNonBlankString(value)) throw new TypeError(`${label} must be a non-blank string.`)
  return value
}

const isCapability = (value: unknown): value is Capability =>
  typeof value === 'string' && CAPABILITIES.includes(value as Capability)

const requireCapability = (value: unknown, label = 'capability'): Capability => {
  if (!isCapability(value)) throw new TypeError(`${label} is unsupported.`)
  return value
}

const requireReasonCode = (value: unknown): ReasonCode => {
  if (typeof value !== 'string' || !REASON_CODES.includes(value as ReasonCode)) {
    throw new TypeError('reason is unsupported.')
  }
  return value as ReasonCode
}

const parseTimestamp = (value: unknown, label: string): { date: Date; iso: string } => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value as string)
  if (
    (typeof value !== 'string' && !(value instanceof Date)) ||
    !Number.isFinite(date.getTime())
  ) {
    throw new TypeError(`${label} must be a valid timestamp.`)
  }
  return { date, iso: date.toISOString() }
}

const requireActor = (actor: unknown): { id: string; kind: 'owner' | 'ai' } => {
  if (!isRecord(actor)) throw new TypeError('actor must be an object.')
  const id = requireNonBlank(actor.id, 'actor.id')
  if (actor.kind !== 'owner' && actor.kind !== 'ai') throw new TypeError('actor.kind is unsupported.')
  return { id, kind: actor.kind }
}

const requireConnectorId = (value: unknown, label = 'connector ID'): ConnectorId =>
  requireNonBlank(value, label) as ConnectorId

const requireAuthorizationDecision = (value: unknown): AuthorizationDecision => {
  if (!isPlainObject(value)) throw new TypeError('decision must be a plain object.')
  assertExactOwnProperties(value, ['allowed', 'reason'], 'decision')
  if (!Object.prototype.hasOwnProperty.call(value, 'allowed') || typeof value.allowed !== 'boolean') {
    throw new TypeError('decision.allowed must be boolean.')
  }
  if (!Object.prototype.hasOwnProperty.call(value, 'reason')) {
    throw new TypeError('decision.reason is required.')
  }
  return { allowed: value.allowed, reason: requireReasonCode(value.reason) }
}

const readCurrentTimestamp = (context: PolicyContext): { date: Date; iso: string } => {
  const timestamp = context.currentTimestamp ?? context.now
  if (timestamp === undefined) throw new TypeError('currentTimestamp is required.')
  return parseTimestamp(timestamp, 'currentTimestamp')
}

const validateBaseContext = (context: PolicyContext): { current: Date; connectorId: ConnectorId } => {
  if (!isRecord(context)) throw new TypeError('policy context must be an object.')
  requireActor(context.actor)
  const connector = context.connector
  if (!isPlainObject(connector)) throw new TypeError('connector must be a plain object.')
  assertExactOwnProperties(connector, CONNECTOR_PUBLIC_KEYS, 'connector')
  const connectorId = requireConnectorId(connector.id)
  requireCapability(context.capability)
  requireNonBlank(context.resource, 'resource')
  const { date: current } = readCurrentTimestamp(context)
  if (!Array.isArray(context.grants)) throw new TypeError('grants must be an array.')
  if (typeof connector.connected !== 'boolean') throw new TypeError('connector.connected must be boolean.')
  if (typeof connector.enabled !== 'boolean') throw new TypeError('connector.enabled must be boolean.')
  if (context.operationDigest !== undefined) requireNonBlank(context.operationDigest, 'operationDigest')
  return { current, connectorId }
}

const validateGrants = (grants: readonly ConnectorGrant[]): void => {
  for (const grant of grants) {
    if (!isRecord(grant)) throw new TypeError('connector grants must be objects.')
    requireConnectorId(grant.connectorId, 'grant.connectorId')
    if (!Array.isArray(grant.capabilities)) throw new TypeError('grant.capabilities must be an array.')
    grant.capabilities.forEach((capability) => requireCapability(capability, 'grant capability'))
  }
}

const hasGrant = (context: PolicyContext, connectorId: ConnectorId): boolean =>
  context.grants.some(
    (grant) =>
      grant.connectorId === connectorId && grant.capabilities.includes(context.capability),
  )

const authorizeApproval = (
  context: PolicyContext,
  current: Date,
): AuthorizationDecision => {
  const approval = context.approval
  if (!approval) return { allowed: false, reason: 'approval_required' }
  requireNonBlank(approval.operationDigest, 'approval.operationDigest')
  if (!isNonBlankString(context.operationDigest)) return { allowed: false, reason: 'approval_digest_mismatch' }
  if (typeof approval.used !== 'boolean' || approval.used) {
    return { allowed: false, reason: 'approval_required' }
  }
  const expiry = parseTimestamp(approval.expiresAt, 'approval.expiresAt').date
  if (expiry.getTime() <= current.getTime()) return { allowed: false, reason: 'approval_expired' }
  if (approval.operationDigest !== context.operationDigest) {
    return { allowed: false, reason: 'approval_digest_mismatch' }
  }
  return { allowed: true, reason: 'allowed' }
}

/** Evaluate a connector capability without side effects or access to credentials. */
export function authorizeCapability(context: PolicyContext): AuthorizationDecision {
  const { current, connectorId } = validateBaseContext(context)
  const connector = context.connector
  if (!connector.connected) return { allowed: false, reason: 'connector_disconnected' }
  if (!connector.enabled) return { allowed: false, reason: 'connector_disabled' }

  validateGrants(context.grants)
  if (!hasGrant(context, connectorId)) return { allowed: false, reason: 'missing_grant' }

  if (
    context.actor.kind === 'ai' &&
    APPROVAL_REQUIRED_CAPABILITIES.has(context.capability)
  ) {
    return { allowed: false, reason: 'ai_sensitive_action' }
  }

  if (context.capability === 'changeCode') {
    const isolated = context.isolation?.isolated ?? context.isolatedExecution ?? false
    if (isolated !== true) return { allowed: false, reason: 'isolation_required' }
    return authorizeApproval(context, current)
  }

  if (APPROVAL_REQUIRED_CAPABILITIES.has(context.capability)) {
    return authorizeApproval(context, current)
  }
  return { allowed: true, reason: 'allowed' }
}

const cloneMetadata = (
  metadata: AuditEventInput['metadata'],
): Readonly<Record<string, string | number | boolean | null>> | undefined => {
  if (metadata === undefined) return undefined
  if (!isPlainObject(metadata)) throw new TypeError('metadata must be a plain object.')
  const clone: Record<string, string | number | boolean | null> = {}
  for (const key of Reflect.ownKeys(metadata)) {
    if (typeof key !== 'string') throw new TypeError('metadata must not contain symbol keys.')
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new TypeError(`metadata key "${key}" is not permitted.`)
    }
    if (SECRET_KEY.test(key)) throw new TypeError(`metadata key "${key}" is not permitted.`)
    const value = metadata[key]
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'boolean' &&
      (typeof value !== 'number' || !Number.isFinite(value))
    ) {
      throw new TypeError(`metadata.${key} must be a JSON-safe scalar.`)
    }
    clone[key] = value
  }
  return Object.freeze(clone)
}

/** Construct a deep-frozen, credential-free audit event. */
export function createAuditEvent(input: AuditEventInput): AuditEvent {
  if (!isPlainObject(input)) throw new TypeError('audit event input must be a plain object.')
  assertExactOwnProperties(input, AUDIT_EVENT_INPUT_KEYS, 'audit event input')
  const actor = requireActor(input.actor)
  let connectorId: ConnectorId
  if (isRecord(input.connector)) {
    if (!isPlainObject(input.connector)) throw new TypeError('audit connector must be a plain object.')
    assertExactOwnProperties(input.connector, CONNECTOR_PUBLIC_KEYS, 'audit connector')
    if ('connected' in input.connector && typeof input.connector.connected !== 'boolean') {
      throw new TypeError('audit connector.connected must be boolean.')
    }
    if ('enabled' in input.connector && typeof input.connector.enabled !== 'boolean') {
      throw new TypeError('audit connector.enabled must be boolean.')
    }
    connectorId = requireConnectorId(input.connector.id)
  } else {
    connectorId = requireConnectorId(input.connector)
  }
  const capability = requireCapability(input.capability)
  const resource = requireNonBlank(input.resource, 'resource')
  const decision = requireAuthorizationDecision(input.decision)
  const { iso } = parseTimestamp(input.timestamp, 'timestamp')
  const correlationId = requireNonBlank(input.correlationId, 'correlationId')
  const event: AuditEvent = {
    actor: Object.freeze(actor),
    connector: connectorId,
    capability,
    resource,
    result: decision.allowed,
    reason: decision.reason,
    timestamp: iso,
    correlationId,
  }
  const metadata = cloneMetadata(input.metadata)
  if (metadata !== undefined) {
    ;(event as { metadata?: AuditEvent['metadata'] }).metadata = metadata
  }
  return Object.freeze(event)
}
