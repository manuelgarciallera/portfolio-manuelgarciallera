import type { AssistanceReview } from './review-types'

type Transport = (url: string, init: RequestInit) => Promise<Response>
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown, limit: number): value is string => typeof value === 'string' && value.length <= limit
const reviewValue = (value: unknown) => record(value) && ['captured', 'not-captured', 'removed'].includes(String(value.state)) && text(value.text, 262144)
const failure = (): never => { throw new Error('No se pudo cargar la comparación. Recarga la página para volver a intentarlo.') }

export const loadAssistanceReview = async (id: string | number, request: Transport = fetch): Promise<AssistanceReview> => {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(String(id))) throw new TypeError('Identificador no válido.')
  const response = await request(`/api/owner/assist/proposals/${encodeURIComponent(String(id))}`, { credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) return failure()
  let result: unknown
  try { result = await response.json() } catch { return failure() }
  const review = record(result) ? result.review : null
  if (!record(review) || review.proposalId !== String(id) || review.appliesChanges !== false || typeof review.snapshotHash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(review.snapshotHash) || !Array.isArray(review.changes) || review.changes.length < 1 || review.changes.length > 32) return failure()
  for (const change of review.changes) {
    if (!record(change) || !text(change.label, 512) || !text(change.path, 256) || !['add', 'remove', 'replace'].includes(String(change.operation)) || !reviewValue(change.before) || !reviewValue(change.proposed)) return failure()
  }
  return review as AssistanceReview
}
