import { createHash } from 'node:crypto'

export type FigmaImportDecision = 'approved' | 'rejected'
export type FigmaImportReview = Readonly<{ decidedAt: string; decidedBy: string | number; decision: FigmaImportDecision; hash: string; note?: string; planHash: string; planId: string | number; schemaVersion: 1 }>

const fields = new Set(['decidedAt', 'decidedBy', 'decision', 'note', 'planHash', 'planId'])
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const relation = (value: unknown, label: string): string | number => { if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) throw new TypeError(`${label} no es válido.`); return value }
const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  const item = value as Record<string, unknown>
  return `{${Object.keys(item).sort().map((key) => `${JSON.stringify(key)}:${stable(item[key])}`).join(',')}}`
}
const digest = (value: unknown): string => `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`

export const createFigmaImportReview = (input: unknown): FigmaImportReview => {
  if (!record(input)) throw new TypeError('La revisión debe ser un objeto.')
  const unknown = Object.keys(input).find((key) => !fields.has(key))
  if (unknown) throw new TypeError(`La revisión contiene un campo no permitido: ${unknown}.`)
  if (typeof input.planHash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(input.planHash)) throw new TypeError('El hash del plan no es válido.')
  if (input.decision !== 'approved' && input.decision !== 'rejected') throw new TypeError('La decisión no es válida.')
  if (typeof input.decidedAt !== 'string' || Number.isNaN(Date.parse(input.decidedAt))) throw new TypeError('La fecha no es válida.')
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.trim().length > 1_000)) throw new TypeError('La nota no es válida.')
  const withoutHash = {
    decidedAt: new Date(input.decidedAt).toISOString(),
    decidedBy: relation(input.decidedBy, 'El owner'),
    decision: input.decision as FigmaImportDecision,
    ...(typeof input.note === 'string' && input.note.trim() ? { note: input.note.trim() } : {}),
    planHash: input.planHash,
    planId: relation(input.planId, 'El plan'),
    schemaVersion: 1 as const,
  }
  return Object.freeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashFigmaImportReview = (review: FigmaImportReview): string => {
  const { hash, ...withoutHash } = review
  const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con la revisión de Figma.')
  return expected
}
