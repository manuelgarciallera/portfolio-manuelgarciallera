import { createHash } from 'node:crypto'

import type { FigmaCandidate, FigmaSource } from './types'

export type FigmaImportPlan = Readonly<{
  schemaVersion: 1
  source: Readonly<{ fileKey: string; nodeId?: string; sourceUrl: string }>
  file: Readonly<{ name: string; lastModified?: string }>
  candidate: Readonly<{ id: string; name: string; type: FigmaCandidate['type']; width?: number; height?: number; sourceUrl: string }>
  preview: Readonly<{ available: boolean; observedAt: string; refreshRequired: true }>
  hash: string
}>

type Input = {
  candidate: FigmaCandidate
  file: { name: string; lastModified?: string }
  observedAt: string
  source: FigmaSource
}

const iso = (value: unknown): value is string => typeof value === 'string' && (() => { try { return new Date(value).toISOString() === value } catch { return false } })()
const bounded = (value: unknown, maximum: number): value is string => typeof value === 'string' && Boolean(value.trim()) && value.trim().length <= maximum
const finiteDimension = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 100_000
const figmaUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 2_048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (url.hostname === 'figma.com' || url.hostname === 'www.figma.com')
  } catch { return false }
}
const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`
}
const digest = (value: Omit<FigmaImportPlan, 'hash'>): string => `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`
const deepFreeze = <T>(value: T): T => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }; return value }

const validate = (input: Input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('La selección de Figma no es válida.')
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(input.source.fileKey) || !figmaUrl(input.source.sourceUrl)) throw new TypeError('La procedencia de Figma no es válida.')
  if (input.source.nodeId !== undefined && !/^[A-Za-z0-9:_-]{1,128}$/.test(input.source.nodeId)) throw new TypeError('El nodo de origen no es válido.')
  if (!bounded(input.file.name, 240) || (input.file.lastModified !== undefined && !iso(input.file.lastModified))) throw new TypeError('El archivo de Figma no es válido.')
  if (!/^[A-Za-z0-9:_-]{1,128}$/.test(input.candidate.id) || !bounded(input.candidate.name, 240) || !['FRAME', 'COMPONENT', 'SECTION'].includes(input.candidate.type) || !figmaUrl(input.candidate.sourceUrl)) throw new TypeError('El candidato de Figma no es válido.')
  if (input.candidate.width !== undefined && !finiteDimension(input.candidate.width)) throw new TypeError('La anchura del candidato no es válida.')
  if (input.candidate.height !== undefined && !finiteDimension(input.candidate.height)) throw new TypeError('La altura del candidato no es válida.')
  if (!iso(input.observedAt)) throw new TypeError('La fecha de observación no es válida.')
}

export const createFigmaImportPlan = (input: Input): FigmaImportPlan => {
  validate(input)
  const candidate = {
    id: input.candidate.id,
    name: input.candidate.name.trim(),
    type: input.candidate.type,
    ...(input.candidate.width !== undefined ? { width: input.candidate.width } : {}),
    ...(input.candidate.height !== undefined ? { height: input.candidate.height } : {}),
    sourceUrl: input.candidate.sourceUrl,
  }
  const withoutHash = {
    schemaVersion: 1 as const,
    source: { fileKey: input.source.fileKey, ...(input.source.nodeId ? { nodeId: input.source.nodeId } : {}), sourceUrl: input.source.sourceUrl },
    file: { name: input.file.name.trim(), ...(input.file.lastModified ? { lastModified: input.file.lastModified } : {}) },
    candidate,
    preview: { available: typeof input.candidate.preview?.url === 'string', observedAt: input.observedAt, refreshRequired: true as const },
  }
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashFigmaImportPlan = (plan: FigmaImportPlan): string => {
  const { hash, ...withoutHash } = plan
  const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con el plan de importación de Figma.')
  return expected
}
