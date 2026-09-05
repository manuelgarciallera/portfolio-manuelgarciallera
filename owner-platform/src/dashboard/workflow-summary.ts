type StatusCounts = Record<string, number>
type WorkflowSummaryInput = {
  artifacts: number
  bundles: number
  figmaImportExecutions: number
  figmaImportPlans: number
  figmaImportReviews: { approved: number; rejected: number }
  preflights: { blocked: number; ready: number; ready_with_warnings: number }
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
  const figmaImportExecutions = count(input.figmaImportExecutions)
  const figmaImportPlans = count(input.figmaImportPlans)
  const figmaImportReviews = normalized(input.figmaImportReviews)
  const figmaImportReviewTotal = total(figmaImportReviews)
  const proposals = normalized(input.proposals)
  const preflights = normalized(input.preflights)
  const restores = normalized(input.restores)
  const reviews = normalized(input.reviews)
  const reviewTotal = total(reviews)
  if (reviewTotal > bundles) throw new TypeError('Las revisiones superan los paquetes disponibles.')
  if (artifacts > reviews.approved) throw new TypeError('Los artefactos superan las revisiones aprobadas.')
  const preflightTotal = total(preflights)
  if (preflightTotal > artifacts) throw new TypeError('Los informes de preflight superan los artefactos disponibles.')
  if (figmaImportReviewTotal > figmaImportPlans) throw new TypeError('Las revisiones de Figma superan los planes disponibles.')
  if (figmaImportExecutions > figmaImportReviews.approved) throw new TypeError('Las importaciones de Figma superan las revisiones aprobadas.')
  const awaitingReview = bundles - reviewTotal
  const figmaAwaitingReview = figmaImportPlans - figmaImportReviewTotal
  const approvedAwaitingImport = figmaImportReviews.approved - figmaImportExecutions
  const approvedAwaitingArtifact = reviews.approved - artifacts
  const awaitingPreflight = artifacts - preflightTotal
  return {
    attentionCount: figmaAwaitingReview + approvedAwaitingImport + proposals.pending + restores.ready + restores.confirmed + restores.conflict + awaitingReview + approvedAwaitingArtifact + awaitingPreflight + preflights.blocked + preflights.ready_with_warnings,
    figmaImport: { approvedAwaitingImport, awaitingReview: figmaAwaitingReview, executions: figmaImportExecutions, plans: figmaImportPlans, reviews: { ...figmaImportReviews, total: figmaImportReviewTotal } },
    proposals: { ...proposals, total: total(proposals) },
    publication: { approvedAwaitingArtifact, artifacts, awaitingPreflight, awaitingReview, bundles, preflights: { ...preflights, total: preflightTotal }, reviews: { ...reviews, total: reviewTotal } },
    restores: { ...restores, total: total(restores) },
  }
}
