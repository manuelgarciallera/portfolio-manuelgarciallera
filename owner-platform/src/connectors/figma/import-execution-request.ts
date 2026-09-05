import { APIError } from 'payload'

import { isOwner } from '../../access/owner'

const MAX_BYTES = 4 * 1_024
class TooLarge extends Error {}
export type FigmaImportExecutionRequest = { alt: string; confirmation: 'IMPORTAR PNG DE FIGMA' }
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const read = async (request: Request) => {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BYTES)) throw new TooLarge()
  if (!request.body) return ''
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0
  while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > MAX_BYTES) { await reader.cancel(); throw new TooLarge() }; chunks.push(value) }
  const merged = new Uint8Array(total); let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(merged)
}

export const parseFigmaImportExecutionRequest = (value: unknown): FigmaImportExecutionRequest => {
  if (!record(value)) throw new TypeError('La importación no es válida.')
  const unknown = Object.keys(value).find((key) => !['alt', 'confirmation'].includes(key))
  if (unknown) throw new TypeError(`La solicitud contiene un campo no permitido: ${unknown}.`)
  if (value.confirmation !== 'IMPORTAR PNG DE FIGMA') throw new TypeError('La confirmación no coincide.')
  if (typeof value.alt !== 'string' || !value.alt.trim() || value.alt.trim().length > 500) throw new TypeError('El texto alternativo no es válido.')
  return { alt: value.alt.trim(), confirmation: 'IMPORTAR PNG DE FIGMA' }
}

export const handleFigmaImportExecutionRequest = async (request: Request, reviewId: string | number, dependencies: {
  authenticate(headers: Headers): Promise<{ user: unknown }>
  execute(input: FigmaImportExecutionRequest & { reviewId: string | number }, user: unknown): Promise<unknown>
}): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const input = parseFigmaImportExecutionRequest(JSON.parse(await read(request)) as unknown)
    return Response.json({ execution: await dependencies.execute({ ...input, reviewId }, authentication.user) }, { status: 201 })
  } catch (error) {
    if (error instanceof TooLarge) return Response.json({ error: 'Request too large.' }, { status: 413 })
    if (error instanceof SyntaxError || error instanceof TypeError) return Response.json({ error: 'Invalid Figma import request.' }, { status: 400 })
    if (error instanceof APIError) return Response.json({ error: 'Figma import failed.' }, { status: error.status >= 400 && error.status < 500 ? error.status : 500 })
    return Response.json({ error: 'Figma import failed.' }, { status: 500 })
  }
}
