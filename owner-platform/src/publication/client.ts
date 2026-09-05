type PublicationTransport = (url: string, init: RequestInit) => Promise<Response>
type Decision = 'approved' | 'rejected'
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const safeId = (value: string | number): string => {
  if (!/^[A-Za-z0-9_-]+$/.test(String(value))) throw new TypeError('El identificador no es válido.')
  return encodeURIComponent(String(value))
}
const failure = (): never => { throw new Error('No se pudo registrar la revisión.') }

export const reviewPublicationBundle = async (
  bundleId: string | number,
  input: { confirmation: string; decision: Decision; note?: string },
  request: PublicationTransport = fetch,
): Promise<{ decision: Decision; href: string }> => {
  const expected = input.decision === 'approved' ? 'APROBAR PAQUETE' : 'RECHAZAR PAQUETE'
  if (input.confirmation !== expected) throw new TypeError(`Escribe ${expected} para continuar.`)
  const note = input.note?.trim()
  if (note && note.length > 1_000) throw new TypeError('La nota no puede superar 1000 caracteres.')
  const response = await request(`/api/owner/publication-bundles/${safeId(bundleId)}/review`, {
    body: JSON.stringify({ confirmation: expected, decision: input.decision, ...(note ? { note } : {}) }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return failure()
  const result = await response.json() as unknown
  const review = isRecord(result) && isRecord(result.review) ? result.review : undefined
  const id = review?.id
  if (review?.decision !== input.decision || ((typeof id !== 'string' && typeof id !== 'number') || !/^[A-Za-z0-9_-]+$/.test(String(id)))) return failure()
  return { decision: input.decision, href: `/admin/collections/publication-reviews/${encodeURIComponent(String(id))}` }
}
