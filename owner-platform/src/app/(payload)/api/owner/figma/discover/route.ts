import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { createFigmaReadProvider } from '@/connectors/figma/provider'
import { handleFigmaDiscoverRequest } from '@/connectors/figma/request'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const provider = createFigmaReadProvider({ token: process.env.FIGMA_ACCESS_TOKEN })
  return handleFigmaDiscoverRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    discover: provider.discover,
  })
}
