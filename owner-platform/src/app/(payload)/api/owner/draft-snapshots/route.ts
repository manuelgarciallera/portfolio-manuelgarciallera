import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePreviewSnapshotRequest } from '@/preview/request'
import { createPageDraftSnapshot } from '@/recovery/service'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handlePreviewSnapshotRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    create: async (pageId, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createPageDraftSnapshot({ pageId, payload: payload as never, req })
    },
  })
}
