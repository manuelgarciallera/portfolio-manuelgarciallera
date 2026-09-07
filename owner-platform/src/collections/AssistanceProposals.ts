import { isDeepStrictEqual } from 'node:util'
import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { documentPanel } from './document-panel'
import { ASSIST_CAPABILITIES } from '../assist/contracts'
import { decideProposalData, PROPOSAL_STATUSES } from '../assist/proposal'

const immutableError = () => new APIError('La propuesta no puede modificarse fuera de su decisión.', 403)
const decisionFields = new Set(['status', 'decisionNote', 'decidedAt', 'decidedBy'])

export const prepareAssistanceProposal: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (operation === 'create') {
    if (
      data.status !== 'pending' ||
      String(data.createdBy) !== String(req.user.id) ||
      typeof data.provider !== 'string' ||
      !/^[a-z][a-z0-9-]{1,31}$/.test(data.provider) ||
      !ASSIST_CAPABILITIES.includes(data.capability) ||
      !data.patch ||
      typeof data.patch !== 'object'
    ) {
      throw new APIError('La propuesta pendiente no es válida.', 400)
    }
    return data
  }
  if (operation !== 'update') {
    throw immutableError()
  }
  if (data.createdAt !== undefined && data.createdAt !== originalDoc?.createdAt) throw immutableError()
  // Payload merges stored fields and timestamps into partial updates. Validate
  // only the changed command, but return complete fields for required validation.
  const command = Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    key !== 'createdAt' && key !== 'updatedAt' && value !== undefined &&
    !(Object.hasOwn(originalDoc ?? {}, key) && isDeepStrictEqual(value, originalDoc[key])),
  ))
  if (Object.keys(command).some((key) => !decisionFields.has(key))) throw immutableError()
  if (command.decidedBy !== undefined && String(command.decidedBy) !== String(req.user.id)) {
    throw new APIError('La identidad de decisión no puede sustituirse.', 400)
  }
  try {
    const decision = decideProposalData(
      { status: originalDoc?.status },
      { decision: command.status, note: command.decisionNote },
      req.user,
      command.decidedAt as string | undefined,
    )
    return { ...data, ...decision }
  } catch {
    throw new APIError('La decisión de propuesta no es válida.', 400)
  }
}

export const enforceAssistanceProposalDelete: CollectionBeforeDeleteHook = async () => {
  throw new APIError('Las propuestas y sus decisiones no pueden eliminarse.', 403)
}

export const AssistanceProposals: CollectionConfig = {
  slug: 'assistance-proposals',
  admin: {
    defaultColumns: ['capability', 'provider', 'status', 'createdAt'],
    useAsTitle: 'capability',
  },
  access: {
    create: () => false,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [prepareAssistanceProposal],
    beforeDelete: [enforceAssistanceProposalDelete],
  },
  fields: [
    documentPanel('./components/AssistanceProposalControls#AssistanceProposalControls'),
    { name: 'targetPage', type: 'relationship', relationTo: 'pages', required: true, admin: { readOnly: true } },
    { name: 'sourceSnapshot', type: 'relationship', relationTo: 'preview-snapshots', required: true, admin: { readOnly: true } },
    {
      name: 'capability',
      type: 'select',
      required: true,
      options: ASSIST_CAPABILITIES.map((value) => ({ label: value, value })),
      admin: { readOnly: true },
    },
    { name: 'provider', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'patch', type: 'json', required: true, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: PROPOSAL_STATUSES.map((value) => ({ label: value, value })),
      admin: { readOnly: true },
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { name: 'decisionNote', type: 'textarea', maxLength: 1_000, admin: { readOnly: true } },
    { name: 'decidedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'decidedAt', type: 'date', admin: { readOnly: true } },
  ],
}
