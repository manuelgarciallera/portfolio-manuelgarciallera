import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleRestorePlanRequest } from '@/restore/request'
import { createOwnerRestorePlan } from '@/restore/service'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleRestorePlanRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    create: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerRestorePlan({ ...input, payload: payload as never, req })
    },
  })
}
