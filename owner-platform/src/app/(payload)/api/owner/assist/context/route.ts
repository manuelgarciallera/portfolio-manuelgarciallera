import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { handleAssistanceContextRequest } from '@/assist/context-request'
import { createOwnerAssistanceContext } from '@/assist/service'
import { assertCurrentProductionRuntime } from '@/config/runtime'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleAssistanceContextRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (sourceSnapshot, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerAssistanceContext({ payload: payload as never, req, sourceSnapshot })
    },
  })
}
