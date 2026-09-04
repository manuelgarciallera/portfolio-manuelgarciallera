import 'server-only'

import type { FigmaCandidate, FigmaCandidateType, FigmaDiscoveryResult, FigmaReadProvider, FigmaSource, PersonalAccessTokenAuth } from './types'

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
type Config = { auth: PersonalAccessTokenAuth; fetchImpl?: Fetch; timeoutMs?: number; maxResponseBytes?: number; maxNodes?: number; maxCandidates?: number; previewScale?: number }
type Stage = 'discovery' | 'previews'
type Failure = Extract<FigmaDiscoveryResult, { ok: false }>
type JsonResult = { ok: true; body: unknown } | { ok: false; failure: Failure }
const candidateTypes = new Set<FigmaCandidateType>(['FRAME', 'COMPONENT', 'SECTION'])
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const finiteOr = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const failure = (code: Failure['code'], stage: Stage, retryAfter?: string): Failure => ({
  ok: false, code,
  message: code === 'rate_limited' ? 'Figma rate limit reached.' : code === 'response_too_large' ? 'Figma response exceeded the configured limit.' : code === 'timeout' ? 'Figma discovery timed out.' : code === 'invalid_response' ? 'Figma returned an invalid response.' : 'Figma could not complete discovery.',
  ...(stage === 'previews' ? { stage } : {}), ...(retryAfter ? { retryAfter } : {}),
})

const readBounded = async (response: Response, cap: number): Promise<string> => {
  const declared = response.headers.get('content-length')
  if (declared && /^\d+$/.test(declared) && Number(declared) > cap) throw new Error('TOO_LARGE')
  if (!response.body) return ''
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let total = 0, text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > cap) { await reader.cancel(); throw new Error('TOO_LARGE') }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

const requestJson = async (url: string, token: string, fetchImpl: Fetch, timeoutMs: number, cap: number, stage: Stage): Promise<JsonResult> => {
  try {
    const response = await fetchImpl(url, { method: 'GET', headers: { 'X-Figma-Token': token }, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) })
    if (response.status === 429) return { ok: false, failure: failure('rate_limited', stage, response.headers.get('retry-after') ?? undefined) }
    if (!response.ok) return { ok: false, failure: failure('upstream_error', stage) }
    const text = await readBounded(response, cap)
    try { return { ok: true, body: JSON.parse(text) } } catch { return { ok: false, failure: failure('invalid_response', stage) } }
  } catch (error) {
    if (error instanceof Error && error.message === 'TOO_LARGE') return { ok: false, failure: failure('response_too_large', stage) }
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return { ok: false, failure: failure('timeout', stage) }
    return { ok: false, failure: failure('upstream_error', stage) }
  }
}

const isFigmaPreviewUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      url.hostname === 'api-cdn.figma.com' || url.hostname === 's3-alpha.figma.com' || url.hostname === 's3-alpha-sig.figma.com' || url.hostname === 'figma-alpha-api.s3.us-west-2.amazonaws.com'
    )
  } catch { return false }
}

const normalizeCandidates = (document: unknown, source: FigmaSource, maxNodes: number, maxCandidates: number) => {
  const candidates: FigmaCandidate[] = []
  let seen = 0, truncated = false
  const visit = (node: unknown, depth: number): void => {
    if (!isRecord(node) || seen >= maxNodes) { if (seen >= maxNodes) truncated = true; return }
    seen += 1
    if (typeof node.id === 'string' && typeof node.name === 'string' && typeof node.type === 'string' && candidateTypes.has(node.type as FigmaCandidateType)) {
      if (candidates.length >= maxCandidates) truncated = true
      else {
        const bounds = isRecord(node.absoluteBoundingBox) ? node.absoluteBoundingBox : undefined
        candidates.push({ id: node.id, name: node.name, type: node.type as FigmaCandidateType,
          ...(typeof bounds?.width === 'number' ? { width: bounds.width } : {}), ...(typeof bounds?.height === 'number' ? { height: bounds.height } : {}),
          sourceUrl: `https://www.figma.com/design/${source.fileKey}?node-id=${node.id.replace(':', '-')}` })
      }
    }
    if (Array.isArray(node.children)) {
      if (depth >= 2 && node.children.length) truncated = true
      else for (const child of node.children) visit(child, depth + 1)
    }
  }
  visit(document, 0)
  return { candidates, truncated }
}

const selectDocument = (body: Record<string, unknown>, source: FigmaSource): { document: unknown; missing: boolean } | undefined => {
  if (!source.nodeId) return isRecord(body.document) ? { document: body.document, missing: false } : undefined
  if (!isRecord(body.nodes) || !(source.nodeId in body.nodes)) return undefined
  const selected = body.nodes[source.nodeId]
  if (selected === null) return { document: undefined, missing: true }
  return isRecord(selected) && isRecord(selected.document) ? { document: selected.document, missing: false } : undefined
}

const discoveryUrl = (source: FigmaSource) => source.nodeId
  ? `https://api.figma.com/v1/files/${encodeURIComponent(source.fileKey)}/nodes?ids=${encodeURIComponent(source.nodeId)}&depth=2`
  : `https://api.figma.com/v1/files/${encodeURIComponent(source.fileKey)}?depth=2`

export const createFigmaReadProvider = (config: Config): FigmaReadProvider => ({
  async discover(source) {
    const token = config.auth.kind === 'personal-access-token' ? config.auth.token?.trim() : undefined
    if (!token) return { ok: false, code: 'disabled', message: 'Figma discovery is not configured.' }
    const fetchImpl = config.fetchImpl ?? fetch
    const timeoutMs = Math.min(Math.max(finiteOr(config.timeoutMs, 8_000), 1), 30_000)
    const cap = Math.min(Math.max(finiteOr(config.maxResponseBytes, 2 * 1024 * 1024), 1), 5 * 1024 * 1024)
    const maxNodes = Math.min(Math.max(finiteOr(config.maxNodes, 2_000), 1), 5_000)
    const maxCandidates = Math.min(Math.max(finiteOr(config.maxCandidates, 100), 1), 250)
    const scale = Math.min(Math.max(finiteOr(config.previewScale, 1), 0.01), 4)
    const discovered = await requestJson(discoveryUrl(source), token, fetchImpl, timeoutMs, cap, 'discovery')
    if (!discovered.ok) return discovered.failure
    if (!isRecord(discovered.body) || typeof discovered.body.name !== 'string') return failure('invalid_response', 'discovery')
    const selected = selectDocument(discovered.body, source)
    if (!selected) return failure('invalid_response', 'discovery')
    const normalized = selected.document ? normalizeCandidates(selected.document, source, maxNodes, maxCandidates) : { candidates: [], truncated: false }
    if (normalized.candidates.length) {
      const params = new URLSearchParams({ ids: normalized.candidates.map(({ id }) => id).join(','), format: 'png', scale: String(scale) })
      const rendered = await requestJson(`https://api.figma.com/v1/images/${encodeURIComponent(source.fileKey)}?${params}`, token, fetchImpl, timeoutMs, cap, 'previews')
      if (!rendered.ok) return rendered.failure
      if (!isRecord(rendered.body) || !isRecord(rendered.body.images)) return failure('invalid_response', 'previews')
      for (const candidate of normalized.candidates) {
        const url = rendered.body.images[candidate.id]
        if (url !== null && !isFigmaPreviewUrl(url)) return failure('invalid_response', 'previews')
        candidate.preview = { url, expiresAfterDays: 30 }
      }
    }
    const thumbnail = discovered.body.thumbnailUrl
    if (thumbnail !== undefined && thumbnail !== null && !isFigmaPreviewUrl(thumbnail)) return failure('invalid_response', 'discovery')
    return { ok: true, file: { name: discovered.body.name,
      ...(typeof discovered.body.lastModified === 'string' ? { lastModified: discovered.body.lastModified } : {}),
      ...(typeof thumbnail === 'string' ? { thumbnail: { url: thumbnail } } : {}) }, candidates: normalized.candidates, truncated: normalized.truncated,
      ...(source.nodeId ? { selectedNodeMissing: selected.missing } : {}) }
  },
})
