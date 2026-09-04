import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 4 * 1_024
class RequestTooLarge extends Error {}
export type PublicationArtifactRequest = { confirmation: 'GENERAR ARTEFACTO' }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

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

export const parsePublicationArtifactRequest = (value: unknown): PublicationArtifactRequest => {
  if (!isRecord(value)) throw new TypeError('La solicitud no es válida.')
  const unknown = Object.keys(value).find((key) => key !== 'confirmation')
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'GENERAR ARTEFACTO') throw new TypeError('La confirmación no coincide.')
  return { confirmation: 'GENERAR ARTEFACTO' }
}

export const handlePublicationArtifactRequest = async (request: Request, reviewId: string | number, dependencies: {
  authenticate: (headers: Headers) => Promise<{ user: unknown }>
  generate: (input: PublicationArtifactRequest & { reviewId: string | number }, user: unknown) => Promise<unknown>
}): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parsePublicationArtifactRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    return Response.json({ artifact: await dependencies.generate({ ...input, reviewId }, authentication.user) }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid publication artifact request.' }, { status: 400 })
    if (error instanceof APIError) { const status = error.status >= 400 && error.status < 500 ? error.status : 500; return Response.json({ error: status === 404 ? 'Publication review not found.' : 'Publication artifact generation failed.' }, { status }) }
    return Response.json({ error: 'Publication artifact generation failed.' }, { status: 500 })
  }
}
