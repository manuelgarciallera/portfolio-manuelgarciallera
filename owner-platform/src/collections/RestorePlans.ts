import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { createRestorePlanData, RESTORE_PLAN_STATUSES } from '../restore/plan'

const decisionFields = new Set([
  'confirmedAt',
  'confirmedBy',
  'confirmationSnapshot',
  'conflictHash',
  'status',
])
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/

const immutableError = () => new APIError('El plan de restauración es inmutable fuera de su confirmación.', 403)

export const prepareRestorePlan: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (operation === 'create') {
    try {
      return createRestorePlanData(data, req.user)
    } catch {
      throw new APIError('El plan de restauración no es válido.', 400)
    }
  }
  if (operation !== 'update' || Object.keys(data).some((key) => !decisionFields.has(key))) {
    throw immutableError()
  }
  if (originalDoc?.status !== 'ready') throw new APIError('El plan ya no está preparado para confirmación.', 409)
  if (data.status !== 'confirmed' && data.status !== 'conflict') {
    throw new APIError('El resultado de confirmación no es válido.', 400)
  }
  if (String(data.confirmedBy) !== String(req.user.id)) {
    throw new APIError('La identidad de confirmación no puede sustituirse.', 400)
  }
  if (
    (typeof data.confirmationSnapshot !== 'string' && typeof data.confirmationSnapshot !== 'number') ||
    !String(data.confirmationSnapshot).trim() ||
    typeof data.confirmedAt !== 'string' ||
    Number.isNaN(Date.parse(data.confirmedAt)) ||
    new Date(data.confirmedAt).toISOString() !== data.confirmedAt
  ) {
    throw new APIError('La confirmación del plan no es válida.', 400)
  }
  if (
    (data.status === 'conflict' && (typeof data.conflictHash !== 'string' || !HASH_PATTERN.test(data.conflictHash))) ||
    (data.status === 'confirmed' && data.conflictHash !== undefined)
  ) {
    throw new APIError('El estado de conflicto no es válido.', 400)
  }
  return data
}

export const enforceRestorePlanDelete: CollectionBeforeDeleteHook = async () => {
  throw new APIError('Los planes de restauración son inmutables y no se pueden eliminar.', 403)
}

export const RestorePlans: CollectionConfig = {
  slug: 'restore-plans',
  admin: {
    defaultColumns: ['release', 'targetPage', 'status', 'createdAt'],
    useAsTitle: 'status',
  },
  access: {
    create: () => false,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [prepareRestorePlan],
    beforeDelete: [enforceRestorePlanDelete],
  },
  fields: [
    { name: 'release', type: 'relationship', relationTo: 'releases', required: true, admin: { readOnly: true } },
    { name: 'targetPage', type: 'relationship', relationTo: 'pages', required: true, admin: { readOnly: true } },
    { name: 'targetSnapshot', type: 'relationship', relationTo: 'preview-snapshots', required: true, admin: { readOnly: true } },
    { name: 'targetHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'targetDraftSnapshot', type: 'relationship', relationTo: 'draft-snapshots', required: true, admin: { readOnly: true } },
    { name: 'targetCapsuleHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'baselineSnapshot', type: 'relationship', relationTo: 'preview-snapshots', required: true, admin: { readOnly: true } },
    { name: 'baselineHash', type: 'text', required: true, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: RESTORE_PLAN_STATUSES.map((value) => ({ label: value, value })),
      admin: { readOnly: true },
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { name: 'confirmationSnapshot', type: 'relationship', relationTo: 'preview-snapshots', admin: { readOnly: true } },
    { name: 'conflictHash', type: 'text', admin: { readOnly: true } },
    { name: 'confirmedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'confirmedAt', type: 'date', admin: { readOnly: true } },
  ],
}
