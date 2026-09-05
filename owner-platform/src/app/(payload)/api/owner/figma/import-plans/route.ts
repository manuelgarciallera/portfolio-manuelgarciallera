import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { createFigmaReadProvider } from '@/connectors/figma/provider'
import { handleFigmaImportPlanRequest } from '@/connectors/figma/import-request'
import { createOwnerFigmaImportPlan } from '@/connectors/figma/import-service'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const plan = process.env.FIGMA_PLAN
  const provider = createFigmaReadProvider({
    auth: {
      kind: 'personal-access-token',
      token: process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
      plan: plan === 'enterprise' || plan === 'organization' || plan === 'professional' ? plan : 'starter',
    },
  })
  return handleFigmaImportPlanRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    create: (input, user) => createOwnerFigmaImportPlan({ ...input, payload: payload as never, provider, req: { user } }),
  })
}
