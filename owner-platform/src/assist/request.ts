import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 64 * 1_024

class RequestTooLarge extends Error {}

type ProposalRequest = {
  patch: unknown
  provider: string
  sourceSnapshot: string | number
}

type DecisionRequest = {
  confirmation: 'ACEPTAR PROPUESTA' | 'RECHAZAR PROPUESTA'
  decision: 'accepted' | 'rejected'
  note?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) {
    throw new RequestTooLarge()
  }
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
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}

const assertExactKeys = (input: Record<string, unknown>, allowed: readonly string[]): void => {
  const unknown = Object.keys(input).find((key) => !allowed.includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
}

export const parseAssistanceProposalRequest = (value: unknown): ProposalRequest => {
  if (!isRecord(value)) throw new TypeError('La propuesta no es válida.')
  assertExactKeys(value, ['patch', 'provider', 'sourceSnapshot'])
  if (
    (typeof value.sourceSnapshot !== 'string' && typeof value.sourceSnapshot !== 'number') ||
    !String(value.sourceSnapshot).trim()
  ) {
    throw new TypeError('El snapshot es obligatorio.')
  }
  if (typeof value.provider !== 'string' || !/^[a-z][a-z0-9-]{1,31}$/.test(value.provider)) {
    throw new TypeError('El provider no es válido.')
  }
  if (!Object.hasOwn(value, 'patch')) throw new TypeError('El patch es obligatorio.')
  return { patch: value.patch, provider: value.provider, sourceSnapshot: value.sourceSnapshot }
}

export const parseAssistanceDecisionRequest = (value: unknown): DecisionRequest => {
  if (!isRecord(value)) throw new TypeError('La decisión no es válida.')
  assertExactKeys(value, ['confirmation', 'decision', 'note'])
  if (value.decision !== 'accepted' && value.decision !== 'rejected') {
    throw new TypeError('La decisión debe aceptar o rechazar la propuesta.')
  }
  const confirmation = value.decision === 'accepted' ? 'ACEPTAR PROPUESTA' : 'RECHAZAR PROPUESTA'
  if (value.confirmation !== confirmation) throw new TypeError('La confirmación de la decisión no coincide.')
  if (value.note !== undefined && (typeof value.note !== 'string' || value.note.trim().length > 1_000)) {
    throw new TypeError('La nota de decisión no es válida.')
  }
  return {
    confirmation,
    decision: value.decision,
    ...(typeof value.note === 'string' && value.note.trim() ? { note: value.note.trim() } : {}),
  }
}

const errorResponse = (error: unknown, fallback: string): Response => {
  if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
  if (error instanceof SyntaxError || error instanceof TypeError) {
    return Response.json({ error: 'Invalid assistance request.' }, { status: 400 })
  }
  if (error instanceof APIError) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500
    return Response.json({ error: status === 404 ? 'Assistance resource not found.' : fallback }, { status })
  }
  return Response.json({ error: fallback }, { status: 500 })
}

export const handleAssistanceProposalRequest = async (
  request: Request,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    create: (input: ProposalRequest, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) {
      return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    }
    const input = parseAssistanceProposalRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    const proposal = await dependencies.create(input, authentication.user)
    return Response.json({ proposal }, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Assistance proposal creation failed.')
  }
}

export const handleAssistanceDecisionRequest = async (
  request: Request,
  proposalId: string | number,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    decide: (input: DecisionRequest & { proposalId: string | number }, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) {
      return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    }
    const input = parseAssistanceDecisionRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    const proposal = await dependencies.decide({ ...input, proposalId }, authentication.user)
    return Response.json({ proposal })
  } catch (error) {
    return errorResponse(error, 'Assistance proposal decision failed.')
  }
}
