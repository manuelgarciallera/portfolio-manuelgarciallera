import type { PayloadRequest } from 'payload'
import { projectContentVisualPreview, type PageVisualPreview } from './visual-service'
import { loadValidatedSnapshot } from './snapshot-media'
import { presentPreviewAsset } from '../media/placement-preview'

export async function loadSnapshotVisualPreview({ req, snapshotId }: { req: PayloadRequest; snapshotId: string }): Promise<PageVisualPreview> {
  const { doc, manifest } = await loadValidatedSnapshot(req, snapshotId)
  const refs = new Map<string, Record<string, unknown>>()
  for (const raw of manifest.mediaReferences) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.id !== 'string' || refs.has(raw.id)) throw new Error('Invalid captured media identity')
    refs.set(raw.id, raw)
  }
  const result = await projectContentVisualPreview({ collection: 'pages', documentId: manifest.source.documentId,
    read: async (collection, id) => {
      if (collection === 'pages' && id === manifest.source.documentId) return {
        title: manifest.pageTitle ?? 'Captura sin título guardado', updatedAt: doc.createdAt, _status: 'snapshot',
        layout: manifest.pageBlocks, brandProfile: 'captured-brand',
      }
      if (collection === 'brand-profiles' && id === 'captured-brand') return manifest.brandTokens
      if (collection === 'media-placements') {
        const entry = manifest.mediaPlacements?.find(entry => entry.id === id)
        if (entry) return { placement: entry.placement }
      }
      if (collection === 'media') {
        const ref = refs.get(id)
        if (ref?.storage === 'versioned') return ref
      }
      // In particular: project grids capture IDs, not project contents. Never
      // backfill these references from a live project or a current media row.
      throw new Error('No se guardó esta relación en la captura.')
    },
    presentAsset: (value, id) => {
      const ref = value as Record<string, unknown>
      // Reuse canonical revision and dimensions validation; replace only with
      // the private snapshot route, whose access is checked again on every GET.
      const asset = presentPreviewAsset({ ...ref, url: `/api/media/revision/${encodeURIComponent(id)}/${ref.storageRevision}/${encodeURIComponent(String(ref.filename))}` }, id)
      return { ...asset, url: `/api/media/snapshot/${encodeURIComponent(snapshotId)}/${encodeURIComponent(id)}` }
    },
  })
  if (manifest.pageTitle === undefined) result.warnings.push('Esta captura no conserva el título de la página.')
  return result
}
