type Transport = (url: string, init: RequestInit) => Promise<Response>
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]+$/.test(String(value))
const fail = (): never => { throw new Error('No se pudo importar la imagen de Figma.') }

export const executeFigmaImport = async (reviewId: string | number, input: { alt: string; confirmation: string }, request: Transport = fetch) => {
  if (!safeId(reviewId)) throw new TypeError('El identificador de la revisión no es válido.')
  const alt = input.alt.trim()
  if (!alt || alt.length > 500) throw new TypeError('El texto alternativo debe tener entre 1 y 500 caracteres.')
  if (input.confirmation !== 'IMPORTAR PNG DE FIGMA') throw new TypeError('Escribe IMPORTAR PNG DE FIGMA para continuar.')
  const response = await request(`/api/owner/figma/import-reviews/${encodeURIComponent(String(reviewId))}/execute`, {
    body: JSON.stringify({ alt, confirmation: 'IMPORTAR PNG DE FIGMA' }), credentials: 'same-origin', headers: { 'content-type': 'application/json' }, method: 'POST',
  })
  if (!response.ok) return fail()
  let body: unknown
  try { body = await response.json() as unknown } catch { return fail() }
  const execution = record(body) && record(body.execution) ? body.execution : undefined
  if (!execution || !safeId(execution.id) || !safeId(execution.media) || !safeId(execution.placement)) return fail()
  return {
    executionHref: `/admin/collections/figma-import-executions/${encodeURIComponent(String(execution.id))}`,
    mediaHref: `/admin/collections/media/${encodeURIComponent(String(execution.media))}`,
    placementHref: `/admin/collections/media-placements/${encodeURIComponent(String(execution.placement))}`,
  }
}
