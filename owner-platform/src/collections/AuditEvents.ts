import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { AUDIT_OUTCOMES, createAuditEventData, type AuditEventInput } from '../audit/event'

const immutableError = () => new APIError('Los eventos de auditoría son inmutables.', 403)

export const prepareAuditEvent: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Solo el owner puede registrar eventos.', 403)
  if (data.actor !== undefined && String(data.actor) !== String(req.user.id)) {
    throw new APIError('La identidad del actor no puede sustituirse.', 400)
  }
  try {
    return createAuditEventData(
      {
        action: data.action,
        metadata: data.metadata,
        outcome: data.outcome,
        subject: { collection: data.subjectCollection, id: data.subjectId },
      } as AuditEventInput,
      req.user,
    )
  } catch {
    throw new APIError('El evento de auditoría no es válido.', 400)
  }
}

export const enforceAuditEventDelete: CollectionBeforeDeleteHook = async () => {
  throw immutableError()
}

type AuditPayload = {
  create(args: {
    collection: 'audit-events'
    data: ReturnType<typeof createAuditEventData>
    overrideAccess: true
    req?: unknown
    user: unknown
  }): Promise<unknown>
}

export const recordAuditEvent = async ({
  input,
  payload,
  req,
  user,
}: {
  input: AuditEventInput
  payload: AuditPayload
  req?: unknown
  user: unknown
}): Promise<unknown> => {
  if (!isOwner(user)) throw new APIError('Solo el owner puede registrar eventos.', 403)
  const data = createAuditEventData(input, user)
  return payload.create({
    collection: 'audit-events',
    data,
    overrideAccess: true,
    ...(req ? { req } : {}),
    user,
  })
}

export const AuditEvents: CollectionConfig = {
  slug: 'audit-events',
  admin: {
    defaultColumns: ['action', 'subjectCollection', 'outcome', 'createdAt'],
    useAsTitle: 'action',
  },
  access: {
    create: () => false,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [prepareAuditEvent],
    beforeDelete: [enforceAuditEventDelete],
  },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { name: 'action', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'subjectCollection', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'subjectId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    {
      name: 'outcome',
      type: 'select',
      required: true,
      options: AUDIT_OUTCOMES.map((value) => ({ label: value, value })),
      admin: { readOnly: true },
    },
    { name: 'metadata', type: 'json', required: true, admin: { readOnly: true } },
  ],
}
