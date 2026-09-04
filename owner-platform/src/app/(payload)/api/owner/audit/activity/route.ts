import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { getOwnerAuditActivity } from '@/audit/activity-service'
import { handleAuditActivityRequest } from '@/audit/activity-request'
import { assertCurrentProductionRuntime } from '@/config/runtime'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleAuditActivityRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerAuditActivity({ payload: payload as never, req })
    },
  })
}
