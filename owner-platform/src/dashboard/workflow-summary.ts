type StatusCounts = Record<string, number>
type WorkflowSummaryInput = {
  artifacts: number
  bundles: number
  proposals: { accepted: number; pending: number; rejected: number }
  restores: { confirmed: number; conflict: number; executed: number; ready: number }
  reviews: { approved: number; rejected: number }
}

const count = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError('El recuento no es válido.')
  return value as number
}
const normalized = <T extends StatusCounts>(input: T): T => Object.fromEntries(Object.entries(input).map(([key, value]) => [key, count(value)])) as T
const total = (input: StatusCounts): number => Object.values(input).reduce((sum, value) => sum + value, 0)

export const buildWorkflowSummary = (input: WorkflowSummaryInput) => {
  const bundles = count(input.bundles)
  const artifacts = count(input.artifacts)
  const proposals = normalized(input.proposals)
  const restores = normalized(input.restores)
  const reviews = normalized(input.reviews)
  const reviewTotal = total(reviews)
  if (reviewTotal > bundles) throw new TypeError('Las revisiones superan los paquetes disponibles.')
  if (artifacts > reviews.approved) throw new TypeError('Los artefactos superan las revisiones aprobadas.')
  const awaitingReview = bundles - reviewTotal
  const approvedAwaitingArtifact = reviews.approved - artifacts
  return {
    attentionCount: proposals.pending + restores.ready + restores.confirmed + restores.conflict + awaitingReview + approvedAwaitingArtifact,
    proposals: { ...proposals, total: total(proposals) },
    publication: { approvedAwaitingArtifact, artifacts, awaitingReview, bundles, reviews: { ...reviews, total: reviewTotal } },
    restores: { ...restores, total: total(restores) },
  }
}
