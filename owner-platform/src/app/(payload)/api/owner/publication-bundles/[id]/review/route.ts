import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePublicationReviewRequest } from '@/publication/review-request'
import { createOwnerPublicationReview } from '@/publication/review-service'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handlePublicationReviewRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    review: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerPublicationReview({ ...input, payload: payload as never, req })
    },
  })
}
