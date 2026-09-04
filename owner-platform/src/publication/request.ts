import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 16 * 1_024
class RequestTooLarge extends Error {}

type PublicationBundleRequest = {
  confirmation: string
  name: string
  releaseIds: Array<string | number>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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
    if (total > MAX_REQUEST_BYTES) { await reader.cancel(); throw new RequestTooLarge() }
    chunks.push(value)
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}

export const parsePublicationBundleRequest = (value: unknown): PublicationBundleRequest => {
  if (!isRecord(value)) throw new TypeError('La solicitud no es válida.')
  const unknown = Object.keys(value).find((key) => !['confirmation', 'name', 'releaseIds'].includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'PREPARAR PUBLICACIÓN') throw new TypeError('La confirmación de preparación no coincide.')
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 120) throw new TypeError('El nombre no es válido.')
  if (!Array.isArray(value.releaseIds) || value.releaseIds.length < 1 || value.releaseIds.length > 100) throw new TypeError('La selección no es válida.')
  const releaseIds = value.releaseIds.map((id) => {
    if ((typeof id !== 'string' && typeof id !== 'number') || !String(id).trim()) throw new TypeError('La selección contiene una versión no válida.')
    return id
  })
  if (new Set(releaseIds.map(String)).size !== releaseIds.length) throw new TypeError('La selección contiene versiones duplicadas.')
  return { confirmation: value.confirmation, name: value.name.trim(), releaseIds }
}

export const handlePublicationBundleRequest = async (
  request: Request,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    create: (input: PublicationBundleRequest, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parsePublicationBundleRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    return Response.json({ bundle: await dependencies.create(input, authentication.user) }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid publication bundle request.' }, { status: 400 })
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: status === 404 ? 'Publication resource not found.' : 'Publication bundle creation failed.' }, { status })
    }
    return Response.json({ error: 'Publication bundle creation failed.' }, { status: 500 })
  }
}
