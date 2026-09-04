import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildIntegrationStatus } from './integration-status'

type GlobalPayload = { findGlobal(args: Record<string, unknown>): Promise<Record<string, unknown>> }

export const getOwnerIntegrationStatus = async ({ environment, payload, req }: { environment: { figmaPlan?: string; figmaToken?: string }; payload: GlobalPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const switches = await payload.findGlobal({ overrideAccess: false, req, slug: 'assistant-settings' })
  return buildIntegrationStatus({ ...environment, switches })
}
