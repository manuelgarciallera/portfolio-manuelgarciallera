const MAX_REQUEST_BYTES = 256 * 1024
type AnalyticsImportTransport = (url: string, init: RequestInit) => Promise<Response>
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseAnalyticsImportText = (text: string): Record<string, unknown> => {
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch {
    throw new TypeError('El archivo no contiene JSON válido.')
  }
  if (!isRecord(value)) throw new TypeError('El archivo debe contener un objeto JSON.')
  return value
}

export const submitAnalyticsImport = async (
  text: string,
  request: AnalyticsImportTransport = fetch,
): Promise<unknown> => {
  const data = parseAnalyticsImportText(text)
  const body = JSON.stringify({ confirmation: 'IMPORTAR ANALÍTICA', data })
  if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
    throw new RangeError('El archivo supera el límite de 256 KiB.')
  }
  const response = await request('/api/owner/analytics/snapshots', {
    body,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) throw new Error('No se pudo importar el snapshot analítico.')
  const result = await response.json() as { snapshot?: unknown }
  if (!isRecord(result.snapshot)) throw new Error('No se pudo importar el snapshot analítico.')
  return result.snapshot
}
