import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { documentPanel } from './document-panel'
import { hashFigmaImportPlan, type FigmaImportPlan } from '../connectors/figma/import-plan'

const immutableError = () => new APIError('Los planes de importación de Figma son inmutables.', 403)

export const prepareFigmaImportPlan: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const plan = data.plan as FigmaImportPlan
  let hash: string
  try { hash = hashFigmaImportPlan(plan) } catch { throw new APIError('El plan de importación no supera la verificación de hash.', 400) }
  if (
    data.planHash !== hash ||
    data.schemaVersion !== plan.schemaVersion ||
    data.status !== 'pending' ||
    String(data.createdBy) !== String(req.user.id) ||
    data.sourceFileKey !== plan.source.fileKey ||
    data.nodeId !== plan.candidate.id ||
    data.candidateName !== plan.candidate.name ||
    data.candidateType !== plan.candidate.type
  ) throw new APIError('La procedencia persistida no coincide con el plan de importación.', 400)
  return data
}

export const enforceFigmaImportPlanDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const FigmaImportPlans: CollectionConfig = {
  slug: 'figma-import-plans',
  admin: { defaultColumns: ['candidateName', 'candidateType', 'sourceFileKey', 'status', 'createdAt'], useAsTitle: 'candidateName' },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [prepareFigmaImportPlan], beforeDelete: [enforceFigmaImportPlanDelete] },
  fields: [
    documentPanel('./components/FigmaImportPlanControls#FigmaImportPlanControls'),
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'status', type: 'select', required: true, options: [{ label: 'Pendiente', value: 'pending' }], admin: { readOnly: true } },
    { name: 'sourceFileKey', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'nodeId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'candidateName', type: 'text', required: true, maxLength: 240, admin: { readOnly: true } },
    { name: 'candidateType', type: 'select', required: true, options: ['FRAME', 'COMPONENT', 'SECTION'], admin: { readOnly: true } },
    { name: 'plan', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'planHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
