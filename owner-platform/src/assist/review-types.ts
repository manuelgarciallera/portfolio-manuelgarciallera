export type AssistanceReviewValue = Readonly<{ state: 'captured' | 'not-captured' | 'removed'; text: string }>
export type AssistanceReview = Readonly<{
  proposalId: string
  snapshotHash: string
  appliesChanges: false
  changes: readonly Readonly<{
    path: string
    label: string
    operation: 'add' | 'remove' | 'replace'
    before: AssistanceReviewValue
    proposed: AssistanceReviewValue
  }>[]
}>
