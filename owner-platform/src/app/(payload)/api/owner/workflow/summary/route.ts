import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleWorkflowSummaryRequest } from '@/dashboard/workflow-summary-request'
import { getOwnerWorkflowSummary } from '@/dashboard/workflow-summary-service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleWorkflowSummaryRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerWorkflowSummary({ payload: payload as never, req })
    },
  })
}
