import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { handleAnalyticsSnapshotRequest } from '@/analytics/request'
import { createOwnerAnalyticsSnapshot } from '@/analytics/service'
import { assertCurrentProductionRuntime } from '@/config/runtime'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleAnalyticsSnapshotRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    create: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerAnalyticsSnapshot({ ...input, payload: payload as never, req })
    },
  })
}
