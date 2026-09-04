import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleOwnerSearchRequest } from '@/search/request'
import { searchOwnerContent } from '@/search/service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleOwnerSearchRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    search: async (query, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return searchOwnerContent({ payload: payload as never, query, req })
    },
  })
}
