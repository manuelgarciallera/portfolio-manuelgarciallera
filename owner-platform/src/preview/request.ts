import { APIError } from 'payload'
import { isOwner } from '../access/owner'

export type PreviewSnapshotRequest = { pageId: number | string; version: 'current-draft' }
const MAX_REQUEST_BYTES = 4_096
class RequestTooLarge extends Error {}

const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RequestTooLarge()
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel()
      throw new RequestTooLarge()
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}

export const parsePreviewSnapshotRequest = (value: unknown): PreviewSnapshotRequest => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Solicitud de preview no válida.')
  const input = value as Record<string, unknown>
  const unknown = Object.keys(input).find((key) => !['pageId', 'version'].includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if ((typeof input.pageId !== 'number' && typeof input.pageId !== 'string') || String(input.pageId).trim() === '')
    throw new TypeError('pageId es obligatorio.')
  if (input.version !== undefined && input.version !== 'current-draft')
    throw new TypeError('La versión solicitada no está soportada.')
  return { pageId: input.pageId, version: 'current-draft' }
}

export const handlePreviewSnapshotRequest = async (
  request: Request,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    create: (pageId: number | string, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user))
      return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const raw = await readBoundedBody(request)
    const selection = parsePreviewSnapshotRequest(JSON.parse(raw) as unknown)
    const snapshot = await dependencies.create(selection.pageId, authentication.user)
    return Response.json({ snapshot }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge)
      return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError)
      return Response.json({ error: 'Invalid preview request.' }, { status: 400 })
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: status === 404 ? 'Preview resource not found.' : 'Preview request failed.' }, { status })
    }
    return Response.json({ error: 'Preview snapshot creation failed.' }, { status: 500 })
  }
}
