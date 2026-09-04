import { AUDIT_OUTCOMES } from './event'

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('El evento no es válido.')
  return value as Record<string, unknown>
}
const identifier = (value: unknown): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) throw new TypeError('El identificador no es válido.')
  return value
}
const text = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} no es válido.`)
  return value.trim()
}

export const buildAuditActivity = (input: unknown[]) => ({
  count: input.length,
  events: input.map((value) => {
    const event = record(value)
    const action = text(event.action, 'La acción')
    if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){1,5}$/.test(action)) throw new TypeError('La acción no es válida.')
    const outcome = text(event.outcome, 'El resultado')
    if (!AUDIT_OUTCOMES.includes(outcome as (typeof AUDIT_OUTCOMES)[number])) throw new TypeError('El resultado no es válido.')
    const collection = text(event.subjectCollection, 'La colección')
    if (!/^[a-z][a-z0-9-]{1,63}$/.test(collection)) throw new TypeError('La colección no es válida.')
    const createdAt = new Date(text(event.createdAt, 'La fecha')).toISOString()
    return {
      id: identifier(event.id),
      action,
      outcome: outcome as (typeof AUDIT_OUTCOMES)[number],
      subject: { collection, id: String(identifier(event.subjectId)) },
      createdAt,
    }
  }),
})
