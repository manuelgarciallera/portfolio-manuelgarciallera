import { APIError } from 'payload'

import { isOwner } from '../../access/owner'
import { parseFigmaSource } from './url'

const MAX_REQUEST_BYTES = 4_096
class RequestTooLarge extends Error {}

export type FigmaImportPlanRequest = Readonly<{ candidateId: string; confirmation: 'PREPARAR IMPORTACIÓN FIGMA'; source: string }>
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const readBoundedBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RequestTooLarge()
  if (!request.body) return ''
  const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true })
  let total = 0, result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_REQUEST_BYTES) { await reader.cancel(); throw new RequestTooLarge() }
    result += decoder.decode(value, { stream: true })
  }
  return result + decoder.decode()
}

export const parseFigmaImportPlanRequest = (value: unknown): FigmaImportPlanRequest => {
  if (!record(value)) throw new TypeError('La solicitud no es válida.')
  const unknown = Object.keys(value).find((key) => !['candidateId', 'confirmation', 'source'].includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'PREPARAR IMPORTACIÓN FIGMA') throw new TypeError('La confirmación no coincide.')
  if (typeof value.candidateId !== 'string' || !/^\d+:\d+$/.test(value.candidateId)) throw new TypeError('El candidato no es válido.')
  if (typeof value.source !== 'string' || value.source.length > 2_048) throw new TypeError('La fuente no es válida.')
  try { parseFigmaSource(value.source) } catch { throw new TypeError('La fuente no es válida.') }
  return { candidateId: value.candidateId, confirmation: value.confirmation, source: value.source.trim() }
}

export const handleFigmaImportPlanRequest = async (request: Request, dependencies: {
  authenticate(headers: Headers): Promise<{ user: unknown }>
  create(input: FigmaImportPlanRequest, user: unknown): Promise<unknown>
}): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parseFigmaImportPlanRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    return Response.json({ importPlan: await dependencies.create(input, authentication.user) }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid Figma import plan request.' }, { status: 400 })
    if (error instanceof APIError) return Response.json({ error: 'Figma import plan creation failed.' }, { status: error.status >= 400 && error.status < 500 ? error.status : 500 })
    return Response.json({ error: 'Figma import plan creation failed.' }, { status: 500 })
  }
}
