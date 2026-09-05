import { parseFigmaSource } from './url'

type Transport = (url: string, init: RequestInit) => Promise<Response>
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]+$/.test(String(value))
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const fail = (): never => { throw new Error('No se pudo preparar la importación de Figma.') }

export const prepareFigmaImportPlan = async (source: string, candidateId: string, request: Transport = fetch): Promise<{ href: string; id: string | number }> => {
  try { parseFigmaSource(source) } catch { throw new TypeError('El enlace de Figma no es válido.') }
  if (!/^\d+:\d+$/.test(candidateId)) throw new TypeError('El candidato de Figma no es válido.')
  const response = await request('/api/owner/figma/import-plans', {
    body: JSON.stringify({ candidateId, confirmation: 'PREPARAR IMPORTACIÓN FIGMA', source }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return fail()
  let body: unknown
  try { body = await response.json() as unknown } catch { return fail() }
  const plan = record(body) && record(body.importPlan) ? body.importPlan : undefined
  if (!plan || !safeId(plan.id) || plan.status !== 'pending') return fail()
  return { href: `/admin/collections/figma-import-plans/${encodeURIComponent(String(plan.id))}`, id: plan.id }
}
