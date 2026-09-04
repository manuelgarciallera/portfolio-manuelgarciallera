import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import type { PublicationReviewDecision } from './review'

const MAX_REQUEST_BYTES = 8 * 1_024
class RequestTooLarge extends Error {}

export type PublicationReviewRequest = { confirmation: string; decision: PublicationReviewDecision; note?: string }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RequestTooLarge()
  if (!request.body) return ''
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    total += value.byteLength
    if (total > MAX_REQUEST_BYTES) { await reader.cancel(); throw new RequestTooLarge() }
    chunks.push(value)
  }
  const merged = new Uint8Array(total); let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}

export const parsePublicationReviewRequest = (value: unknown): PublicationReviewRequest => {
  if (!isRecord(value)) throw new TypeError('La revisión no es válida.')
  const unknown = Object.keys(value).find((key) => !['confirmation', 'decision', 'note'].includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.decision !== 'approved' && value.decision !== 'rejected') throw new TypeError('La decisión no es válida.')
  const expected = value.decision === 'approved' ? 'APROBAR PAQUETE' : 'RECHAZAR PAQUETE'
  if (value.confirmation !== expected) throw new TypeError('La confirmación no coincide con la decisión.')
  if (value.note !== undefined && (typeof value.note !== 'string' || value.note.trim().length > 1_000)) throw new TypeError('La nota no es válida.')
  return { confirmation: expected, decision: value.decision, ...(typeof value.note === 'string' && value.note.trim() ? { note: value.note.trim() } : {}) }
}

export const handlePublicationReviewRequest = async (
  request: Request,
  bundleId: string | number,
  dependencies: { authenticate: (headers: Headers) => Promise<{ user: unknown }>; review: (input: PublicationReviewRequest & { bundleId: string | number }, user: unknown) => Promise<unknown> },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parsePublicationReviewRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    return Response.json({ review: await dependencies.review({ ...input, bundleId }, authentication.user) }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid publication review request.' }, { status: 400 })
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: status === 404 ? 'Publication bundle not found.' : 'Publication review failed.' }, { status })
    }
    return Response.json({ error: 'Publication review failed.' }, { status: 500 })
  }
}
