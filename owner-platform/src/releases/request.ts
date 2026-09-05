import { APIError } from 'payload'

import { isOwner } from '../access/owner'

const MAX_REQUEST_BYTES = 16 * 1_024
const RELEASE_REQUEST_FIELDS = ['changeSummary', 'draftSnapshot', 'gitCommit', 'name', 'previewSnapshot', 'quality'] as const
const RELEASE_INPUT_FIELDS = ['confirmation', ...RELEASE_REQUEST_FIELDS] as const
class RequestTooLarge extends Error {}

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

export const parseReleaseRequest = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError('La versión no es válida.')
  const unknown = Object.keys(value).find((key) => !RELEASE_INPUT_FIELDS.includes(key as never))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'REGISTRAR VERSIÓN') throw new TypeError('La confirmación de registro no coincide.')
  if (RELEASE_REQUEST_FIELDS.some((key) => !Object.hasOwn(value, key))) {
    throw new TypeError('Faltan datos obligatorios de la versión.')
  }
  if (typeof value.name !== 'string' || typeof value.changeSummary !== 'string') {
    throw new TypeError('El nombre y resumen no son válidos.')
  }
  if (typeof value.gitCommit !== 'string' || !/^[a-f0-9]{40}$/.test(value.gitCommit)) {
    throw new TypeError('El commit no es válido.')
  }
  if (
    (typeof value.previewSnapshot !== 'string' && typeof value.previewSnapshot !== 'number') ||
    !String(value.previewSnapshot).trim()
  ) {
    throw new TypeError('El snapshot no es válido.')
  }
  if (!Array.isArray(value.quality)) throw new TypeError('Las métricas no son válidas.')
  return Object.fromEntries(RELEASE_REQUEST_FIELDS.map((key) => [key, value[key]]))
}

export const handleReleaseRequest = async (
  request: Request,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    create: (input: Record<string, unknown>, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) {
      return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    }
    const input = parseReleaseRequest(JSON.parse(await readBoundedBody(request)) as unknown)
    const release = await dependencies.create(input, authentication.user)
    return Response.json({ release }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestTooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return Response.json({ error: 'Invalid release request.' }, { status: 400 })
    }
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: status === 404 ? 'Release resource not found.' : 'Release registration failed.' }, { status })
    }
    return Response.json({ error: 'Release registration failed.' }, { status: 500 })
  }
}
