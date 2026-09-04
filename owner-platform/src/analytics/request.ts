import { APIError } from 'payload'
import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 256 * 1024
class RequestTooLarge extends Error {}
export type AnalyticsSnapshotRequest = { confirmation: 'IMPORTAR ANALÍTICA'; data: unknown }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length'); if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RequestTooLarge()
  if (!request.body) return ''; const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0
  while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > MAX_REQUEST_BYTES) { await reader.cancel(); throw new RequestTooLarge() }; chunks.push(value) }
  const merged = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }; return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}
export const parseAnalyticsSnapshotRequest = (value: unknown): AnalyticsSnapshotRequest => {
  if (!isRecord(value)) throw new TypeError('La solicitud no es válida.'); const unknown = Object.keys(value).find((key) => !['confirmation', 'data'].includes(key)); if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'IMPORTAR ANALÍTICA') throw new TypeError('La confirmación no coincide.'); if (!isRecord(value.data)) throw new TypeError('Los datos no son válidos.')
  return { confirmation: 'IMPORTAR ANALÍTICA', data: value.data }
}
export const handleAnalyticsSnapshotRequest = async (request: Request, dependencies: { authenticate: (headers: Headers) => Promise<{ user: unknown }>; create: (input: AnalyticsSnapshotRequest, user: unknown) => Promise<unknown> }): Promise<Response> => {
  try { const authentication = await dependencies.authenticate(request.headers); if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 }); const input = parseAnalyticsSnapshotRequest(JSON.parse(await readBoundedBody(request)) as unknown); return Response.json({ snapshot: await dependencies.create(input, authentication.user) }, { status: 201 }) }
  catch (error) { if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 }); if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid analytics snapshot request.' }, { status: 400 }); if (error instanceof APIError) { const status = error.status >= 400 && error.status < 500 ? error.status : 500; return Response.json({ error: 'Analytics snapshot creation failed.' }, { status }) }; return Response.json({ error: 'Analytics snapshot creation failed.' }, { status: 500 }) }
}
