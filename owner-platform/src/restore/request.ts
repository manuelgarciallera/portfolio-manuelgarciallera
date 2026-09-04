import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 4_096
class RequestTooLarge extends Error {}

type PlanRequest = { baselineSnapshot: string | number; confirmation: string; releaseId: string | number }
type ConfirmationRequest = { confirmation: string; currentSnapshot: string | number }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const relation = (value: unknown, label: string): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) {
    throw new TypeError(`${label} no es válido.`)
  }
  return value
}

const exact = (input: Record<string, unknown>, fields: readonly string[]): void => {
  const unknown = Object.keys(input).find((key) => !fields.includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
}

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

export const parseRestorePlanRequest = (value: unknown): PlanRequest => {
  if (!isRecord(value)) throw new TypeError('La solicitud no es válida.')
  exact(value, ['baselineSnapshot', 'confirmation', 'releaseId'])
  if (value.confirmation !== 'PREPARAR RESTAURACIÓN') throw new TypeError('La primera confirmación no coincide.')
  return {
    baselineSnapshot: relation(value.baselineSnapshot, 'El snapshot base'),
    confirmation: value.confirmation,
    releaseId: relation(value.releaseId, 'La versión'),
  }
}

export const parseRestoreConfirmationRequest = (value: unknown): ConfirmationRequest => {
  if (!isRecord(value)) throw new TypeError('La confirmación no es válida.')
  exact(value, ['confirmation', 'currentSnapshot'])
  if (value.confirmation !== 'CONFIRMAR RESTAURACIÓN') throw new TypeError('La segunda confirmación no coincide.')
  return {
    confirmation: value.confirmation,
    currentSnapshot: relation(value.currentSnapshot, 'El snapshot actual'),
  }
}

const errorResponse = (error: unknown): Response => {
  if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
  if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid restore request.' }, { status: 400 })
  if (error instanceof APIError) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500
    return Response.json({ error: status === 404 ? 'Restore resource not found.' : 'Restore request failed.' }, { status })
  }
  return Response.json({ error: 'Restore request failed.' }, { status: 500 })
}

export const handleRestorePlanRequest = async (
  request: Request,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    create: (input: PlanRequest, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parseRestorePlanRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    return Response.json({ plan: await dependencies.create(input, authentication.user) }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export const handleRestoreConfirmationRequest = async (
  request: Request,
  planId: string | number,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    confirm: (input: ConfirmationRequest & { planId: string | number }, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parseRestoreConfirmationRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    return Response.json({ plan: await dependencies.confirm({ ...input, planId }, authentication.user) })
  } catch (error) {
    return errorResponse(error)
  }
}
