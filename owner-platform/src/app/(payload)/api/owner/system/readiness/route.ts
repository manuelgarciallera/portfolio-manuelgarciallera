import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleReadinessRequest } from '@/dashboard/readiness-request'
import { getOwnerReadiness } from '@/dashboard/readiness-service'

const environment = () => ({ databaseUrl: process.env.DATABASE_URL, nodeEnv: process.env.NODE_ENV, payloadSecret: process.env.PAYLOAD_SECRET })

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleReadinessRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: (user) => Promise.resolve(getOwnerReadiness({ environment: environment(), user })),
  })
}
