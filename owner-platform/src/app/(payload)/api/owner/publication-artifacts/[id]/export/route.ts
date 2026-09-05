import config from '@payload-config'
import { getPayload } from 'payload'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { handlePublicationExportRequest } from '@/publication/export-request'
import { createOwnerPublicationExport } from '@/publication/export-service'

export const GET = async (request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  const { id } = await context.params
  return handlePublicationExportRequest(request, id, {
    authenticate: (headers) => payload.auth({ headers }),
    generate: (artifactId, user) => createOwnerPublicationExport({ artifactId, payload: payload as never, req: { user } }),
  })
}
