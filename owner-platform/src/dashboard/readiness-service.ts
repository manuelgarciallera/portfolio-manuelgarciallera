import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildOwnerReadiness } from './readiness'

export const getOwnerReadiness = ({ environment, user }: { environment: { databaseUrl?: string; nodeEnv?: string; payloadSecret?: string }; user: unknown }) => {
  if (!isOwner(user)) throw new APIError('Se requiere una sesión owner.', 403)
  return buildOwnerReadiness(environment)
}
