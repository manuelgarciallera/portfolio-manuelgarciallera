export type PreviewFrame =
  | { kind: 'cover' }
  | { kind: 'slide'; index: number }

export interface PreviewRegion {
  id: string
  top: number
  bottom: number
}

export const COVER_DURATION_MS = 2300
export const SLIDE_DURATION_MS = 4200

export function frameDurationMs(frame: PreviewFrame): number {
  return frame.kind === 'cover' ? COVER_DURATION_MS : SLIDE_DURATION_MS
}

export function centeredTabScrollLeft(
  itemLeft: number,
  itemWidth: number,
  viewportWidth: number,
  maxScroll: number,
): number {
  const centred = itemLeft - (viewportWidth - itemWidth) / 2
  return Math.min(Math.max(centred, 0), Math.max(maxScroll, 0))
}

export function advancePreviewFrame(frame: PreviewFrame, slideCount: number): PreviewFrame {
  if (slideCount < 1) return { kind: 'cover' }
  if (frame.kind === 'cover') return { kind: 'slide', index: 0 }
  if (frame.index >= slideCount - 1) return { kind: 'cover' }
  return { kind: 'slide', index: frame.index + 1 }
}

export function selectCenteredPreview(
  regions: PreviewRegion[],
  viewportHeight: number,
): string | null {
  const viewportCenter = viewportHeight / 2
  const candidates = regions.filter(({ top, bottom }) => top >= 0 && bottom <= viewportHeight)

  if (candidates.length === 0) return null

  return candidates.reduce((closest, candidate) => {
    const closestDistance = Math.abs((closest.top + closest.bottom) / 2 - viewportCenter)
    const candidateDistance = Math.abs((candidate.top + candidate.bottom) / 2 - viewportCenter)
    return candidateDistance < closestDistance ? candidate : closest
  }).id
}
