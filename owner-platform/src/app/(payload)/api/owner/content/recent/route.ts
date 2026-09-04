import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleRecentContentRequest } from '@/dashboard/recent-content-request'
import { getOwnerRecentContent } from '@/dashboard/recent-content-service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleRecentContentRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerRecentContent({ payload: payload as never, req })
    },
  })
}
