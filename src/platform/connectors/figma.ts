import type { MediaPlacement } from '../content/model'

const FIGMA_HOSTS = new Set(['figma.com', 'www.figma.com'])
const FIGMA_PATHS = new Set(['design', 'file', 'proto'])

export interface ParsedFigmaUrl {
  fileKey: string
  nodeId?: string
  sourceUrl: string
}

export interface FigmaSourceMetadata {
  provider: 'figma'
  fileKey: string
  sourceUrl: string
  nodeId?: string
}

export interface FigmaNodeCandidate {
  nodeId: string
  name: string
  width: number
  height: number
  thumbnailUrl?: string
  placement?: MediaPlacement
  source: FigmaSourceMetadata
}

export type FigmaNodeCandidateInput = Omit<FigmaNodeCandidate, 'source'> & {
  source?: Partial<FigmaSourceMetadata>
}

export interface FigmaImportProposalInput {
  sourceUrl?: string
  url?: string
  candidates?: readonly FigmaNodeCandidateInput[]
  targetName?: string
  targetAspectRatio?: number
  targetWidth?: number
  targetHeight?: number
  confidence?: number
}

export interface FigmaImportProposal {
  source: ParsedFigmaUrl
  candidates: FigmaNodeCandidate[]
  confidence: number
  reasons: string[]
  provenance: FigmaSourceMetadata
  requiresConfirmation: true
}

const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Math.min(maximum, Math.max(minimum, value))

const clonePlacement = (placement: MediaPlacement): MediaPlacement => {
  const clone: MediaPlacement = {
    assetId: placement.assetId,
    focalX: placement.focalX,
    focalY: placement.focalY,
    zoom: placement.zoom,
    fit: placement.fit,
  }
  if (placement.frame) clone.frame = { ...placement.frame }
  if (placement.breakpointOverrides) {
    clone.breakpointOverrides = Object.fromEntries(
      Object.entries(placement.breakpointOverrides).map(([breakpoint, override]) => [
        breakpoint,
        {
          ...override,
          ...(override.frame ? { frame: { ...override.frame } } : {}),
        },
      ]),
    )
  }
  return clone
}

const cloneCandidate = (
  candidate: FigmaNodeCandidateInput,
  source: FigmaSourceMetadata,
): FigmaNodeCandidate => {
  if (typeof candidate.nodeId !== 'string' || candidate.nodeId.length === 0) {
    throw new TypeError('Figma candidate nodeId must be a non-empty string.')
  }
  if (typeof candidate.name !== 'string') {
    throw new TypeError('Figma candidate name must be a string.')
  }
  if (
    typeof candidate.width !== 'number' ||
    !Number.isFinite(candidate.width) ||
    candidate.width < 0
  ) {
    throw new TypeError('Figma candidate width must be a non-negative finite number.')
  }
  if (
    typeof candidate.height !== 'number' ||
    !Number.isFinite(candidate.height) ||
    candidate.height < 0
  ) {
    throw new TypeError('Figma candidate height must be a non-negative finite number.')
  }
  const clone: FigmaNodeCandidate = {
    nodeId: candidate.nodeId,
    name: candidate.name,
    width: candidate.width,
    height: candidate.height,
    source: {
      provider: 'figma',
      fileKey: source.fileKey,
      sourceUrl: source.sourceUrl,
      nodeId: candidate.nodeId,
    },
  }
  if (candidate.thumbnailUrl !== undefined) clone.thumbnailUrl = candidate.thumbnailUrl
  if (candidate.placement !== undefined) clone.placement = clonePlacement(candidate.placement)
  return clone
}

const decodePathPart = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new TypeError('Figma URL contains malformed path encoding.')
  }
}

const normalizeNodeId = (value: string): string => {
  const normalized = /^([0-9]+)-([0-9]+)$/.exec(value)
  return normalized ? `${normalized[1]}:${normalized[2]}` : value
}

/** Parse and canonicalize a Figma document or prototype URL without network access. */
export function parseFigmaUrl(input: string): ParsedFigmaUrl {
  if (typeof input !== 'string' || input.trim() !== input || input.length === 0) {
    throw new TypeError('Figma URL must be a non-empty string.')
  }

  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new TypeError('Figma URL is malformed.')
  }
  if (url.protocol !== 'https:') throw new TypeError('Figma URL must use HTTPS.')
  if (!FIGMA_HOSTS.has(url.hostname)) throw new TypeError('Figma URL host is not allowed.')
  if (url.port) throw new TypeError('Figma URL must use the standard HTTPS port.')
  if (url.username || url.password) throw new TypeError('Figma URL must not contain credentials.')

  const segments = url.pathname.split('/')
  const kind = segments[1]
  const rawFileKey = segments[2]
  if (!kind || !FIGMA_PATHS.has(kind) || !rawFileKey) {
    throw new TypeError('Figma URL must identify a design, file, or prototype file.')
  }
  const fileKey = decodePathPart(rawFileKey)
  if (!/^[A-Za-z0-9_-]+$/.test(fileKey)) {
    throw new TypeError('Figma file key contains unsupported characters.')
  }

  const rawNodeId = url.searchParams.get('node-id')
  if (url.searchParams.has('node-id') && !rawNodeId) {
    throw new TypeError('Figma node-id must not be empty.')
  }
  const nodeId = rawNodeId ? normalizeNodeId(rawNodeId) : undefined
  const canonicalUrl = `${url.origin}${url.pathname}${nodeId ? `?node-id=${encodeURIComponent(nodeId)}` : ''}`

  return {
    fileKey,
    ...(nodeId ? { nodeId } : {}),
    sourceUrl: canonicalUrl,
  }
}

const normalizeName = (name: string): string => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()

const ratioFor = (width: number, height: number): number | undefined =>
  width > 0 && height > 0 ? width / height : undefined

const ratioScore = (candidate: FigmaNodeCandidate, target: number | undefined): number => {
  const ratio = ratioFor(candidate.width, candidate.height)
  if (target === undefined || ratio === undefined) return target === undefined ? 0 : 0
  return clamp(1 - Math.abs(Math.log(ratio / target)) / Math.log(4))
}

const nameScore = (candidateName: string, targetName: string | undefined): number => {
  if (!targetName) return 0
  const candidate = normalizeName(candidateName)
  const target = normalizeName(targetName)
  if (!target) return 0
  if (candidate === target) return 1
  if (candidate.includes(target) || target.includes(candidate)) return 0.6
  return 0
}

const targetRatioFor = (input: FigmaImportProposalInput): number | undefined => {
  if (typeof input.targetAspectRatio === 'number' && Number.isFinite(input.targetAspectRatio) && input.targetAspectRatio > 0) {
    return input.targetAspectRatio
  }
  if (
    typeof input.targetWidth === 'number' &&
    typeof input.targetHeight === 'number' &&
    Number.isFinite(input.targetWidth) &&
    Number.isFinite(input.targetHeight) &&
    input.targetWidth > 0 &&
    input.targetHeight > 0
  ) {
    return input.targetWidth / input.targetHeight
  }
  return undefined
}

const candidateReason = (
  candidate: FigmaNodeCandidate,
  targetName: string | undefined,
  targetRatio: number | undefined,
): string[] => {
  const reasons: string[] = []
  const match = nameScore(candidate.name, targetName)
  if (match === 1) reasons.push('Exact normalized name match.')
  else if (match > 0) reasons.push('Partial normalized name match.')
  if (targetRatio !== undefined) {
    const compatibility = ratioScore(candidate, targetRatio)
    if (compatibility >= 0.75) reasons.push('Compatible aspect ratio.')
    else if (compatibility > 0) reasons.push('Partially compatible aspect ratio.')
  }
  return reasons
}

/** Build a deterministic, confirmation-gated import proposal from local candidate data. */
export function createFigmaImportProposal(
  input: FigmaImportProposalInput | string,
): FigmaImportProposal {
  const prepared: FigmaImportProposalInput =
    typeof input === 'string' ? { sourceUrl: input, candidates: [] } : input
  if (!prepared || typeof prepared !== 'object') {
    throw new TypeError('Figma import proposal input must be an object or URL string.')
  }
  const sourceInput = prepared.sourceUrl ?? prepared.url
  if (typeof sourceInput !== 'string') throw new TypeError('Figma import proposal requires a source URL.')
  const source = parseFigmaUrl(sourceInput)
  const provenance: FigmaSourceMetadata = {
    provider: 'figma',
    fileKey: source.fileKey,
    sourceUrl: source.sourceUrl,
    ...(source.nodeId ? { nodeId: source.nodeId } : {}),
  }
  const candidates = (prepared.candidates ?? []).map((candidate) => cloneCandidate(candidate, provenance))
  const targetRatio = targetRatioFor(prepared)
  const ranked = candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score:
        nameScore(candidate.name, prepared.targetName) * (prepared.targetName ? 0.75 : 0) +
        ratioScore(candidate, targetRatio) * (targetRatio !== undefined ? 0.25 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
  const rankedCandidates = ranked.map(({ candidate }) => candidate)
  const best = ranked[0]
  const confidenceValue =
    typeof prepared.confidence === 'number' && !Number.isNaN(prepared.confidence)
      ? prepared.confidence
      : best?.score ?? 0
  const confidence = clamp(confidenceValue)
  const reasons = best
    ? candidateReason(best.candidate, prepared.targetName, targetRatio)
    : ['No Figma node candidates were supplied.']
  if (reasons.length === 0) reasons.push('No name or aspect-ratio match signal was supplied.')

  return {
    source: { ...source },
    candidates: rankedCandidates,
    confidence,
    reasons: [...reasons],
    provenance: { ...provenance },
    requiresConfirmation: true,
  }
}
