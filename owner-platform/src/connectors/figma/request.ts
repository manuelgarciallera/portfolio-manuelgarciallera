import 'server-only'

import { isOwner } from '../../access/owner'

import type { FigmaDiscoveryResult, FigmaReadProvider } from './types'
import { parseFigmaSource } from './url'

const MAX_REQUEST_BYTES = 4_096

const readBody = async (request: Request): Promise<string> => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new Error('REQUEST_TOO_LARGE')
  if (!request.body) return ''
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel()
      throw new Error('REQUEST_TOO_LARGE')
    }
    result += decoder.decode(value, { stream: true })
  }
  return result + decoder.decode()
}

type Dependencies = {
  authenticate(headers: Headers): Promise<{ user: unknown }>
  discover: FigmaReadProvider['discover']
}

const statusFor = (result: FigmaDiscoveryResult): number => {
  if (result.ok) return 200
  if (result.code === 'rate_limited') return 429
  if (result.code === 'disabled') return 503
  if (result.code === 'invalid_response') return 502
  if (result.code === 'response_too_large') return 502
  if (result.code === 'timeout') return 504
  return 502
}

export const handleFigmaDiscoverRequest = async (request: Request, dependencies: Dependencies): Promise<Response> => {
  const authentication = await dependencies.authenticate(request.headers)
  if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
  let source
  try {
    const raw = await readBody(request)
    const body: unknown = JSON.parse(raw)
    if (!body || typeof body !== 'object' || typeof (body as { source?: unknown }).source !== 'string') throw new Error('INVALID_REQUEST')
    source = parseFigmaSource((body as { source: string }).source)
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') return Response.json({ error: 'Request body is too large.' }, { status: 413 })
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }
  try {
    const result = await dependencies.discover(source)
    const headers = !result.ok && result.code === 'rate_limited' && result.retryAfter ? { 'retry-after': result.retryAfter } : undefined
    return Response.json(result, { status: statusFor(result), headers })
  } catch {
    return Response.json({ error: 'Figma could not complete discovery.' }, { status: 502 })
  }
}
