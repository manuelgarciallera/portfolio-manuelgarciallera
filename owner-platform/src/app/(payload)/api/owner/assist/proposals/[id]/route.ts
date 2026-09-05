import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { handleAssistanceDecisionRequest } from '@/assist/request'
import { decideOwnerAssistanceProposal } from '@/assist/service'
import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleAssistanceReviewRequest } from '@/assist/review-request'
import { loadOwnerAssistanceReview } from '@/assist/review'

type RouteContext = { params: Promise<{ id: string }> }

export const GET = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handleAssistanceReviewRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (proposalId, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return loadOwnerAssistanceReview({ payload, proposalId, req })
    },
  })
}

export const PATCH = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handleAssistanceDecisionRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    decide: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return decideOwnerAssistanceProposal({
        decision: input.decision,
        note: input.note,
        payload: payload as never,
        proposalId: input.proposalId,
        req,
      })
    },
  })
}
