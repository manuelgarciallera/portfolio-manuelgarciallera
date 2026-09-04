import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { handleAssistanceProposalRequest } from '@/assist/request'
import { createOwnerAssistanceProposal } from '@/assist/service'
import { assertCurrentProductionRuntime } from '@/config/runtime'

export const POST = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleAssistanceProposalRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    create: async (input, user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return createOwnerAssistanceProposal({
        patch: input.patch,
        payload: payload as never,
        provider: input.provider,
        req,
        sourceSnapshot: input.sourceSnapshot,
      })
    },
  })
}
