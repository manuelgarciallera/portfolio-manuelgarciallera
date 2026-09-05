type RestoreTransport = (url: string, init: RequestInit) => Promise<Response>
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const failure = (): never => { throw new Error('No se pudo preparar la restauración.') }
const safeId = (value: string | number): string => {
  const normalized = String(value)
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) throw new TypeError('El identificador de restauración no es válido.')
  return encodeURIComponent(normalized)
}

export const prepareRestorePlan = async (
  href: string,
  confirmation: string,
  request: RestoreTransport = fetch,
): Promise<{ href: string; status: 'ready' }> => {
  if (confirmation !== 'PREPARAR RESTAURACIÓN') throw new TypeError('Escribe PREPARAR RESTAURACIÓN para continuar.')
  if (!/^\/api\/owner\/releases\/[A-Za-z0-9_-]+\/restore-plans$/.test(href)) return failure()
  const response = await request(href, {
    body: JSON.stringify({ confirmation }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return failure()
  const result = await response.json() as unknown
  const plan = isRecord(result) ? isRecord(result.plan) ? result.plan : undefined : undefined
  const id = plan?.id
  if (plan?.status !== 'ready' || ((typeof id !== 'string' && typeof id !== 'number') || !/^[A-Za-z0-9_-]+$/.test(String(id)))) return failure()
  return { href: `/admin/collections/restore-plans/${encodeURIComponent(String(id))}`, status: 'ready' }
}

export const confirmRestorePlan = async (
  planId: string | number,
  pageId: string | number,
  confirmation: string,
  request: RestoreTransport = fetch,
): Promise<{ status: 'confirmed' | 'conflict' }> => {
  if (confirmation !== 'CONFIRMAR RESTAURACIÓN') throw new TypeError('Escribe CONFIRMAR RESTAURACIÓN para continuar.')
  const preview = await request('/api/owner/preview-snapshots', {
    body: JSON.stringify({ pageId, version: 'current-draft' }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!preview.ok) throw new Error('No se pudo confirmar la restauración.')
  const previewResult = await preview.json() as unknown
  const snapshot = isRecord(previewResult) && isRecord(previewResult.snapshot) ? previewResult.snapshot : undefined
  const snapshotId = snapshot?.id
  if ((typeof snapshotId !== 'string' && typeof snapshotId !== 'number') || !/^[A-Za-z0-9_-]+$/.test(String(snapshotId))) throw new Error('No se pudo confirmar la restauración.')
  const response = await request(`/api/owner/restore-plans/${safeId(planId)}/confirm`, {
    body: JSON.stringify({ confirmation, currentSnapshot: snapshotId }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  })
  if (!response.ok) throw new Error('No se pudo confirmar la restauración.')
  const result = await response.json() as unknown
  const plan = isRecord(result) && isRecord(result.plan) ? result.plan : undefined
  if (plan?.status !== 'confirmed' && plan?.status !== 'conflict') throw new Error('No se pudo confirmar la restauración.')
  return { status: plan.status }
}

export const executeRestorePlan = async (
  planId: string | number,
  confirmation: string,
  request: RestoreTransport = fetch,
): Promise<{ status: 'executed' }> => {
  if (confirmation !== 'EJECUTAR RESTAURACIÓN') throw new TypeError('Escribe EJECUTAR RESTAURACIÓN para continuar.')
  const response = await request(`/api/owner/restore-plans/${safeId(planId)}/execute`, {
    body: JSON.stringify({ confirmation }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) throw new Error('No se pudo ejecutar la restauración.')
  const result = await response.json() as unknown
  const plan = isRecord(result) && isRecord(result.plan) ? result.plan : undefined
  if (plan?.status !== 'executed') throw new Error('No se pudo ejecutar la restauración.')
  return { status: 'executed' }
}
