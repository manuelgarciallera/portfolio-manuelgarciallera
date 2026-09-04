import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleContentHealthRequest } from '@/dashboard/content-health-request'
import { getOwnerContentHealth } from '@/dashboard/content-health-service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleContentHealthRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerContentHealth({ payload: payload as never, req })
    },
  })
}
