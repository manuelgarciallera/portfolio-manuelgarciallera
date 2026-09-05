import { createHash } from 'node:crypto'

export type FigmaImportExecution = Readonly<{
  schemaVersion: 1
  reviewId: string | number
  reviewHash: string
  planId: string | number
  planHash: string
  mediaId: string | number
  placementId: string | number
  contentHash: string
  mimeType: 'image/png'
  size: number
  importedAt: string
  importedBy: string | number
  hash: string
}>

type Input = Omit<FigmaImportExecution, 'hash' | 'schemaVersion'>

const digestPattern = /^sha256:[a-f0-9]{64}$/
const identifier = (value: unknown): value is string | number =>
  (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) ||
  (typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value))
const iso = (value: unknown): value is string => typeof value === 'string' && (() => { try { return new Date(value).toISOString() === value } catch { return false } })()
const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`
}
const hash = (value: Omit<FigmaImportExecution, 'hash'>) => `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`

export const createFigmaImportExecution = (input: Input): FigmaImportExecution => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('La importación de Figma no es válida.')
  if (![input.reviewId, input.planId, input.mediaId, input.placementId, input.importedBy].every(identifier)) throw new TypeError('Los identificadores de la importación no son válidos.')
  if (![input.reviewHash, input.planHash, input.contentHash].every((value) => typeof value === 'string' && digestPattern.test(value))) throw new TypeError('Los hashes de la importación no son válidos.')
  if (input.mimeType !== 'image/png') throw new TypeError('La importación debe ser una imagen PNG.')
  if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > 25 * 1024 * 1024) throw new TypeError('El tamaño de la importación no es válido.')
  if (!iso(input.importedAt)) throw new TypeError('La fecha de importación no es válida.')
  const withoutHash = { schemaVersion: 1 as const, ...input }
  return Object.freeze({ ...withoutHash, hash: hash(withoutHash) })
}

export const hashFigmaImportExecution = (execution: FigmaImportExecution): string => {
  const { hash: stored, ...withoutHash } = execution
  const expected = hash(withoutHash)
  if (stored !== expected) throw new TypeError('El hash no coincide con la importación de Figma.')
  return expected
}
