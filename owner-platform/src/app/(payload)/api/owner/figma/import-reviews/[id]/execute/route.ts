import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { executeOwnerFigmaImport } from '@/connectors/figma/import-execution-service'
import { handleFigmaImportExecutionRequest } from '@/connectors/figma/import-execution-request'
import { createFigmaReadProvider } from '@/connectors/figma/provider'

export const POST = async (request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> => {
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
  const { id } = await context.params
  return handleFigmaImportExecutionRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    execute: (input, user) => executeOwnerFigmaImport({ ...input, payload: payload as never, provider, req: { user } }),
  })
}
