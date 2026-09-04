export const AUDIT_OUTCOMES = ['success', 'denied', 'failure'] as const

export type AuditEventInput = {
  action: string
  metadata?: unknown
  outcome: (typeof AUDIT_OUTCOMES)[number]
  subject: { collection: string; id: string | number }
}

export type AuditEventData = {
  action: string
  actor: string | number
  metadata: Record<string, unknown>
  outcome: (typeof AUDIT_OUTCOMES)[number]
  subjectCollection: string
  subjectId: string
}

const blockedKey = /(?:^__proto__$|^prototype$|^constructor$|script|javascript|html|css|command|secret|token|password|authorization|credential|private[-_]?key|api[-_]?key|cookie|session)/i

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const validateMetadata = (value: unknown, depth = 0, ancestors = new Set<object>()): void => {
  if (depth > 6) throw new Error('Los metadatos superan la profundidad permitida.')
  if (value === null || typeof value === 'boolean') return
  if (typeof value === 'string') {
    if (value.length > 4_000) throw new Error('Los metadatos contienen texto demasiado largo.')
    return
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Los metadatos contienen un número no válido.')
    return
  }
  if (!value || typeof value !== 'object') throw new Error('Los metadatos deben ser datos JSON.')
  if (ancestors.has(value)) throw new Error('Los metadatos contienen una referencia cíclica.')
  const next = new Set(ancestors).add(value)
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || value.length > 32) {
      throw new Error('La lista de metadatos no está permitida.')
    }
    for (const item of value) validateMetadata(item, depth + 1, next)
    return
  }
  if (!isPlainRecord(value)) throw new Error('Los metadatos deben ser objetos planos.')
  for (const [key, item] of Object.entries(value)) {
    if (blockedKey.test(key)) throw new Error(`La clave ${key} no está permitida.`)
    validateMetadata(item, depth + 1, next)
  }
}

export const createAuditEventData = (
  input: AuditEventInput,
  actor: { id?: unknown },
): AuditEventData => {
  if (!isPlainRecord(input) || !isPlainRecord(input.subject)) {
    throw new Error('El evento de auditoría debe ser un objeto plano.')
  }
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){1,5}$/.test(input.action)) {
    throw new Error('La acción de auditoría no es válida.')
  }
  if (!AUDIT_OUTCOMES.includes(input.outcome)) throw new Error('El resultado de auditoría no es válido.')
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(input.subject.collection)) {
    throw new Error('La colección auditada no es válida.')
  }
  if (
    (typeof input.subject.id !== 'string' && typeof input.subject.id !== 'number') ||
    !String(input.subject.id).trim()
  ) {
    throw new Error('El identificador del sujeto auditado no es válido.')
  }
  if ((typeof actor.id !== 'string' && typeof actor.id !== 'number') || !String(actor.id).trim()) {
    throw new Error('El actor autenticado no es válido.')
  }

  const metadata = input.metadata ?? {}
  if (!isPlainRecord(metadata)) throw new Error('Los metadatos deben ser un objeto plano.')
  validateMetadata(metadata)
  const serialized = JSON.stringify(metadata)
  if (Buffer.byteLength(serialized, 'utf8') > 32 * 1024) {
    throw new Error('Los metadatos superan el tamaño permitido.')
  }

  return {
    action: input.action,
    actor: actor.id,
    metadata: JSON.parse(serialized) as Record<string, unknown>,
    outcome: input.outcome,
    subjectCollection: input.subject.collection,
    subjectId: String(input.subject.id),
  }
}
