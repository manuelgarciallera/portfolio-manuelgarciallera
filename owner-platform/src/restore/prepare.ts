import { APIError, type Payload, type PayloadRequest } from 'payload'

import { isOwner } from '../access/owner'
import { createPagePreviewSnapshot } from '../preview/service'
import { createOwnerRestorePlan, verifiedSnapshot, type RestorePayload } from './service'

const relationId = (value: unknown, label: string): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const id = (value as Record<string, unknown>).id
    if ((typeof id === 'string' || typeof id === 'number') && String(id).trim()) return id
  }
  throw new APIError(`${label} no tiene identificador.`, 400)
}

export const prepareOwnerRestorePlan = async ({
  payload,
  releaseId,
  req,
}: {
  payload: RestorePayload
  releaseId: string | number
  req: PayloadRequest
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const release = await payload.findByID({ collection: 'releases', depth: 0, id: releaseId, overrideAccess: false, req })
  const target = await verifiedSnapshot(payload, req, relationId(release.previewSnapshot, 'El snapshot objetivo'))
  if (target.manifest.source.collection !== 'pages') throw new APIError('La restauración solo admite versiones de páginas.', 400)
  const baseline = await createPagePreviewSnapshot({
    pageId: target.manifest.source.documentId,
    payload: payload as Payload,
    req,
  })
  return createOwnerRestorePlan({
    baselineSnapshot: relationId(baseline, 'El snapshot base'),
    confirmation: 'PREPARAR RESTAURACIÓN',
    payload,
    releaseId,
    req,
  })
}
