import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleRestoreConfirmationRequest } from '@/restore/request'
import { confirmOwnerRestorePlan } from '@/restore/service'

type RouteContext = { params: Promise<{ id: string }> }

export const PATCH = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handleRestoreConfirmationRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    confirm: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return confirmOwnerRestorePlan({
        confirmation: input.confirmation,
        currentSnapshot: input.currentSnapshot,
        payload: payload as never,
        planId: input.planId,
        req,
      })
    },
  })
}
