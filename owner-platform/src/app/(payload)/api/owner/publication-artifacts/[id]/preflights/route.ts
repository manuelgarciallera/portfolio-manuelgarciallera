import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePublicationPreflightRequest } from '@/publication/preflight-request'
import { createOwnerPublicationPreflight } from '@/publication/preflight-service'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handlePublicationPreflightRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    create: async (artifactId, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerPublicationPreflight({ artifactId, payload: payload as never, req })
    },
  })
}

