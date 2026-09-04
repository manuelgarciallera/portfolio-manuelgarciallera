import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleMediaHealthRequest } from '@/dashboard/media-health-request'
import { getOwnerMediaHealth } from '@/dashboard/media-health-service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleMediaHealthRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerMediaHealth({ payload: payload as never, req })
    },
  })
}
