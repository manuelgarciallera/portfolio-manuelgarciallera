import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildMediaHealth } from './media-health'

type CountPayload = { count(args: Record<string, unknown>): Promise<{ totalDocs: number }> }
const status = (value: 'draft' | 'published') => ({ _status: { equals: value } })
const missing = (field: string) => ({ [field]: { exists: false } })

export const getOwnerMediaHealth = async ({ payload, req }: { payload: CountPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const run = async (collection: 'media' | 'media-placements', where?: Record<string, unknown>) => (await payload.count({ collection, overrideAccess: false, req, ...(where ? { where } : {}) })).totalDocs
  const [assetTotal, assetDrafts, assetPublished, placementTotal, placementDrafts, placementPublished, assetsMissingAlt, assetsMissingDimensions, assetsMissingMimeType, assetsOverFiveMegabytes, placementsMissingAsset] = await Promise.all([
    run('media'), run('media', status('draft')), run('media', status('published')),
    run('media-placements'), run('media-placements', status('draft')), run('media-placements', status('published')),
    run('media', missing('alt')), run('media', { or: [missing('width'), missing('height')] }), run('media', missing('mimeType')),
    run('media', { filesize: { greater_than: 5_242_880 } }), run('media-placements', missing('placement.asset')),
  ])
  return buildMediaHealth({
    assets: { drafts: assetDrafts, published: assetPublished, total: assetTotal },
    issues: { assetsMissingAlt, assetsMissingDimensions, assetsMissingMimeType, assetsOverFiveMegabytes, placementsMissingAsset },
    placements: { drafts: placementDrafts, published: placementPublished, total: placementTotal },
  })
}
