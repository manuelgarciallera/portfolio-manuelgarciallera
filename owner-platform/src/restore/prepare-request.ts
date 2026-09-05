import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 1_024
class RequestTooLarge extends Error {}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RequestTooLarge()
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) throw new RequestTooLarge()
  return text
}

export const handlePrepareRestoreRequest = async (
  request: Request,
  releaseId: string | number,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    prepare: (releaseId: string | number, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = JSON.parse(await readBoundedBody(request)) as unknown
    if (!isRecord(input) || Object.keys(input).length !== 1 || input.confirmation !== 'PREPARAR RESTAURACIÓN') throw new TypeError('La confirmación no coincide.')
    return Response.json({ plan: await dependencies.prepare(releaseId, authentication.user) }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid restore preparation request.' }, { status: 400 })
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: status === 404 ? 'Restore resource not found.' : 'Restore preparation failed.' }, { status })
    }
    return Response.json({ error: 'Restore preparation failed.' }, { status: 500 })
  }
}
