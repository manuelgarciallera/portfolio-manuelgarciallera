import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 4 * 1_024
class RequestTooLarge extends Error {}
export type PublicationPreflightRequest = { confirmation: 'VALIDAR ARTEFACTO' }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]{1,128}$/.test(String(value))
const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RequestTooLarge()
  if (!request.body) return ''
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0
  while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > MAX_REQUEST_BYTES) { await reader.cancel(); throw new RequestTooLarge() }; chunks.push(value) }
  const merged = new Uint8Array(total); let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}

export const parsePublicationPreflightRequest = (value: unknown): PublicationPreflightRequest => {
  if (!isRecord(value)) throw new TypeError('La solicitud no es válida.')
  const unknown = Object.keys(value).find((key) => key !== 'confirmation')
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'VALIDAR ARTEFACTO') throw new TypeError('Escribe VALIDAR ARTEFACTO para continuar.')
  return { confirmation: 'VALIDAR ARTEFACTO' }
}

export const handlePublicationPreflightRequest = async (request: Request, artifactId: string | number, dependencies: {
  authenticate: (headers: Headers) => Promise<{ user: unknown }>
  create: (artifactId: string | number, user: unknown) => Promise<unknown>
}): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    if (!safeId(artifactId)) throw new TypeError('El identificador no es válido.')
    parsePublicationPreflightRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    const created = await dependencies.create(artifactId, authentication.user)
    if (!isRecord(created) || !safeId(created.id) || !Number.isInteger(created.issueCount) || (created.issueCount as number) < 0 || !['blocked', 'ready', 'ready_with_warnings'].includes(String(created.status))) throw new Error('Unsafe preflight result.')
    return Response.json({ preflight: { href: `/admin/collections/publication-preflights/${encodeURIComponent(String(created.id))}`, issueCount: created.issueCount, status: created.status } }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid publication preflight request.' }, { status: 400 })
    if (error instanceof APIError) { const status = error.status >= 400 && error.status < 500 ? error.status : 500; return Response.json({ error: status === 404 ? 'Publication artifact not found.' : 'Publication preflight failed.' }, { status }) }
    return Response.json({ error: 'Publication preflight failed.' }, { status: 500 })
  }
}

