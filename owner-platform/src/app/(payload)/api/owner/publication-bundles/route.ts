import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePublicationBundleRequest } from '@/publication/request'
import { createOwnerPublicationBundle } from '@/publication/service'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handlePublicationBundleRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    create: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerPublicationBundle({ ...input, payload: payload as never, req })
    },
  })
}
