import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePublicationArtifactRequest } from '@/publication/artifact-request'
import { createOwnerPublicationArtifact } from '@/publication/artifact-service'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handlePublicationArtifactRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    generate: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerPublicationArtifact({ ...input, payload: payload as never, req })
    },
  })
}
