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
  /** Figma renders are temporary URLs that expire after 30 days. */
  preview?: { url: string | null; expiresAfterDays: 30 }
}

export type FigmaPlan = 'starter' | 'professional' | 'organization' | 'enterprise'
export type PersonalAccessTokenAuth = {
  kind: 'personal-access-token'
  token?: string
  plan: FigmaPlan
}

export type FigmaDiscoveryResult =
  | {
      ok: true
      file: { name: string; lastModified?: string; thumbnail?: { url: string } }
      candidates: FigmaCandidate[]
      truncated: boolean
      selectedNodeMissing?: boolean
    }
  | {
      ok: false
      code: 'disabled' | 'invalid_response' | 'rate_limited' | 'response_too_large' | 'timeout' | 'upstream_error'
      message: string
      retryAfter?: string
      stage?: 'previews'
    }

export type FigmaReadProvider = Readonly<{
  discover(source: FigmaSource): Promise<FigmaDiscoveryResult>
}>
