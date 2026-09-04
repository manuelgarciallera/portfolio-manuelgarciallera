import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { executeOwnerRestorePlan } from '@/restore/execute'
import { handleRestoreExecutionRequest } from '@/restore/request'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handleRestoreExecutionRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    execute: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return executeOwnerRestorePlan({
        confirmation: input.confirmation,
        payload: payload as never,
        planId: input.planId,
        req,
      })
    },
  })
}
