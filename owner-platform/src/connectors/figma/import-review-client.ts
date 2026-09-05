import type { FigmaImportDecision } from './import-review'

type Transport = (url: string, init: RequestInit) => Promise<Response>
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]+$/.test(String(value))
const fail = (): never => { throw new Error('No se pudo registrar la revisión de Figma.') }

export const reviewFigmaImportPlan = async (planId: string | number, input: { confirmation: string; decision: FigmaImportDecision; note?: string }, request: Transport = fetch) => {
  if (!safeId(planId)) throw new TypeError('El identificador del plan no es válido.')
  const expected = input.decision === 'approved' ? 'APROBAR IMPORTACIÓN FIGMA' : 'RECHAZAR IMPORTACIÓN FIGMA'
  if (input.confirmation !== expected) throw new TypeError(`Escribe ${expected} para continuar.`)
  const note = input.note?.trim()
  if (note && note.length > 1_000) throw new TypeError('La nota no puede superar 1000 caracteres.')
  const response = await request(`/api/owner/figma/import-plans/${encodeURIComponent(String(planId))}/review`, {
    body: JSON.stringify({ confirmation: expected, decision: input.decision, ...(note ? { note } : {}) }), credentials: 'same-origin', headers: { 'content-type': 'application/json' }, method: 'POST',
  })
  if (!response.ok) return fail()
  let body: unknown
  try { body = await response.json() as unknown } catch { return fail() }
  const review = record(body) && record(body.review) ? body.review : undefined
  if (!review || !safeId(review.id) || review.decision !== input.decision) return fail()
  return { decision: input.decision, href: `/admin/collections/figma-import-reviews/${encodeURIComponent(String(review.id))}` }
}
