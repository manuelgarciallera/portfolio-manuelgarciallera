import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleFigmaImportReviewRequest } from '@/connectors/figma/import-review-request'
import { createOwnerFigmaImportReview } from '@/connectors/figma/import-review-service'

export const POST = async (request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handleFigmaImportReviewRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    review: (input, user) => createOwnerFigmaImportReview({ ...input, payload: payload as never, req: { user } }),
  })
}
