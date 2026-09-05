import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildWorkflowSummary } from './workflow-summary'

type CountPayload = { count(args: Record<string, unknown>): Promise<{ totalDocs: number }> }
const status = (value: string) => ({ status: { equals: value } })

export const getOwnerWorkflowSummary = async ({ payload, req }: { payload: CountPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const run = async (collection: string, where?: Record<string, unknown>) => (await payload.count({ collection, overrideAccess: false, req, ...(where ? { where } : {}) })).totalDocs
  const [pending, accepted, rejected, ready, confirmed, conflict, executed, bundles, approved, reviewRejected, artifacts, figmaImportPlans] = await Promise.all([
    run('assistance-proposals', status('pending')), run('assistance-proposals', status('accepted')), run('assistance-proposals', status('rejected')),
    run('restore-plans', status('ready')), run('restore-plans', status('confirmed')), run('restore-plans', status('conflict')), run('restore-plans', status('executed')),
    run('publication-bundles'), run('publication-reviews', { decision: { equals: 'approved' } }), run('publication-reviews', { decision: { equals: 'rejected' } }), run('publication-artifacts'),
    run('figma-import-plans', status('pending')),
  ])
  return buildWorkflowSummary({ artifacts, bundles, figmaImportPlans, proposals: { accepted, pending, rejected }, restores: { confirmed, conflict, executed, ready }, reviews: { approved, rejected: reviewRejected } })
}
