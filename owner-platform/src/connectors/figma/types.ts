export type FigmaSource = {
  fileKey: string
  nodeId?: string
  sourceUrl: string
}

export type FigmaCandidateType = 'FRAME' | 'COMPONENT' | 'SECTION'

export type FigmaCandidate = {
  id: string
  name: string
  type: FigmaCandidateType
  width?: number
  height?: number
  sourceUrl: string
}

export type FigmaDiscoveryResult =
  | {
      ok: true
      file: { name: string; lastModified?: string; thumbnail?: { url: string } }
      candidates: FigmaCandidate[]
      truncated: boolean
    }
  | {
      ok: false
      code: 'disabled' | 'invalid_response' | 'rate_limited' | 'response_too_large' | 'timeout' | 'upstream_error'
      message: string
      retryAfter?: string
    }

export type FigmaReadProvider = Readonly<{
  discover(source: FigmaSource): Promise<FigmaDiscoveryResult>
}>
