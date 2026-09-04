import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleIntegrationStatusRequest } from '@/dashboard/integration-status-request'
import { getOwnerIntegrationStatus } from '@/dashboard/integration-status-service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleIntegrationStatusRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerIntegrationStatus({ environment: { figmaPlan: process.env.FIGMA_PLAN, figmaToken: process.env.FIGMA_PERSONAL_ACCESS_TOKEN }, payload: payload as never, req })
    },
  })
}
