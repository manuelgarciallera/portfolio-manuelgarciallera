type RestoreTransport = (url: string, init: RequestInit) => Promise<Response>
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const failure = (): never => { throw new Error('No se pudo preparar la restauración.') }

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
