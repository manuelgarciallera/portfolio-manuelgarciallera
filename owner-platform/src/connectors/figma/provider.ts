import type { FigmaCandidate, FigmaCandidateType, FigmaDiscoveryResult, FigmaReadProvider, FigmaSource } from './types'

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
type FigmaProviderConfig = {
  token?: string
  fetchImpl?: Fetch
  timeoutMs?: number
  maxResponseBytes?: number
  maxNodes?: number
  maxCandidates?: number
}

const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const candidateTypes = new Set<FigmaCandidateType>(['FRAME', 'COMPONENT', 'SECTION'])

const safeFailure = (code: 'invalid_response' | 'response_too_large' | 'timeout' | 'upstream_error'): FigmaDiscoveryResult => ({
  ok: false,
  code,
  message: code === 'response_too_large'
    ? 'Figma response exceeded the configured limit.'
    : code === 'timeout'
      ? 'Figma discovery timed out.'
      : code === 'invalid_response'
        ? 'Figma returned an invalid response.'
        : 'Figma could not complete discovery.',
})

const readBoundedText = async (response: Response, cap: number): Promise<string> => {
  const declared = response.headers.get('content-length')
  if (declared && /^\d+$/.test(declared) && Number(declared) > cap) throw new Error('RESPONSE_TOO_LARGE')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > cap) {
      await reader.cancel()
      throw new Error('RESPONSE_TOO_LARGE')
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalize = (body: unknown, source: FigmaSource, maxNodes: number, maxCandidates: number): FigmaDiscoveryResult => {
  if (!isRecord(body) || typeof body.name !== 'string' || !isRecord(body.document)) return safeFailure('invalid_response')
  const candidates: FigmaCandidate[] = []
  let seen = 0
  let truncated = false
  const visit = (node: unknown, depth: number): void => {
    if (!isRecord(node) || seen >= maxNodes) {
      if (seen >= maxNodes) truncated = true
      return
    }
    seen += 1
    if (
      depth >= 2 &&
      typeof node.id === 'string' &&
      typeof node.name === 'string' &&
      typeof node.type === 'string' &&
      candidateTypes.has(node.type as FigmaCandidateType)
    ) {
      if (candidates.length >= maxCandidates) truncated = true
      else {
        const bounds = isRecord(node.absoluteBoundingBox) ? node.absoluteBoundingBox : undefined
        const nodeId = node.id
        candidates.push({
          id: nodeId,
          name: node.name,
          type: node.type as FigmaCandidateType,
          ...(typeof bounds?.width === 'number' ? { width: bounds.width } : {}),
          ...(typeof bounds?.height === 'number' ? { height: bounds.height } : {}),
          sourceUrl: `https://www.figma.com/design/${source.fileKey}?node-id=${nodeId.replace(':', '-')}`,
        })
      }
    }
    if (Array.isArray(node.children)) {
      if (depth >= 2 && node.children.length > 0) truncated = true
      else for (const child of node.children) visit(child, depth + 1)
    }
  }
  visit(body.document, 0)
  return {
    ok: true,
    file: {
      name: body.name,
      ...(typeof body.lastModified === 'string' ? { lastModified: body.lastModified } : {}),
      ...(typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.startsWith('https://') ? { thumbnail: { url: body.thumbnailUrl } } : {}),
    },
    candidates,
    truncated,
  }
}

export const createFigmaReadProvider = (config: FigmaProviderConfig): FigmaReadProvider => ({
  async discover(source) {
    const token = config.token?.trim()
    if (!token) return { ok: false, code: 'disabled', message: 'Figma discovery is not configured.' }
    const timeoutMs = Math.min(Math.max(config.timeoutMs ?? 8_000, 1), 30_000)
    const maxResponseBytes = Math.min(Math.max(config.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES, 1), 5 * 1024 * 1024)
    try {
      const response = await (config.fetchImpl ?? fetch)(`https://api.figma.com/v1/files/${encodeURIComponent(source.fileKey)}?depth=2`, {
        method: 'GET',
        headers: { 'X-Figma-Token': token },
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (response.status === 429) return { ok: false, code: 'rate_limited', message: 'Figma rate limit reached.', ...(response.headers.get('retry-after') ? { retryAfter: response.headers.get('retry-after')! } : {}) }
      if (!response.ok) return safeFailure('upstream_error')
      const text = await readBoundedText(response, maxResponseBytes)
      let body: unknown
      try { body = JSON.parse(text) } catch { return safeFailure('invalid_response') }
      return normalize(body, source, Math.min(Math.max(config.maxNodes ?? 2_000, 1), 5_000), Math.min(Math.max(config.maxCandidates ?? 100, 1), 250))
    } catch (error) {
      if (error instanceof Error && error.message === 'RESPONSE_TOO_LARGE') return safeFailure('response_too_large')
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return safeFailure('timeout')
      return safeFailure('upstream_error')
    }
  },
})
