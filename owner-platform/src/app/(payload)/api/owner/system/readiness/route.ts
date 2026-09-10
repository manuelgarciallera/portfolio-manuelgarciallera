import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handleReadinessRequest } from '@/dashboard/readiness-request'
import { getOwnerReadiness } from '@/dashboard/readiness-service'

const environment = () => ({ databaseUrl: process.env.DATABASE_URL, nodeEnv: process.env.NODE_ENV, payloadSecret: process.env.PAYLOAD_SECRET,
  emailApiKey: process.env.OWNER_EMAIL_API_KEY, emailFrom: process.env.OWNER_EMAIL_FROM, serverURL: process.env.OWNER_SERVER_URL })

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const mediaUpload = payload.collections.media?.config.upload
  return handleReadinessRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: (user) => Promise.resolve(getOwnerReadiness({ environment: { ...environment(), mediaMode: process.env.OWNER_MEDIA_MODE,
      mediaLocalStorageDisabled: typeof mediaUpload === 'object' && mediaUpload.disableLocalStorage === true }, user })),
  })
}
