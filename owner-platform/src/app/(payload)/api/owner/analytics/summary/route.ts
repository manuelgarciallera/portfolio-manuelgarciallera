import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { handleAnalyticsSummaryRequest } from '@/analytics/summary-request'
import { getOwnerAnalyticsSummary } from '@/analytics/summary-service'
import { assertCurrentProductionRuntime } from '@/config/runtime'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleAnalyticsSummaryRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerAnalyticsSummary({ payload: payload as never, req })
    },
  })
}
