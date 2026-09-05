import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePrepareRestoreRequest } from '@/restore/prepare-request'
import { prepareOwnerRestorePlan } from '@/restore/prepare'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handlePrepareRestoreRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    prepare: async (releaseId, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return prepareOwnerRestorePlan({ payload: payload as never, releaseId, req })
    },
  })
}
