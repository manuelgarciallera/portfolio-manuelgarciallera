import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildReleaseSummary } from './summary'

type FindPayload = { find(args: Record<string, unknown>): Promise<{ docs: unknown[] }> }

export const getOwnerReleaseSummary = async ({ payload, req }: { payload: FindPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const result = await payload.find({ collection: 'releases', depth: 0, limit: 20, overrideAccess: false, req, sort: '-createdAt' })
  return buildReleaseSummary(result.docs)
}
