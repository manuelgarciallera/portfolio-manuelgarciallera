import assert from 'node:assert/strict'
import { createLocalReq } from 'payload'
import { AuditEvents } from '../../src/collections/AuditEvents.ts'
import { PreviewSnapshots } from '../../src/collections/PreviewSnapshots.ts'
import { editorialAccess, editorialVersions } from '../../src/collections/shared.ts'
import { createPagePreviewSnapshot } from '../../src/preview/service.ts'
import { loadSnapshotVisualPreview } from '../../src/preview/snapshot-visual.ts'

// Minimal persisted inputs for the real snapshot service, not the complete app schema.
export const previewRecoveryCollections = [PreviewSnapshots, AuditEvents,
  { slug: 'pages', access: editorialAccess, versions: editorialVersions, fields: [
    { name: 'title', type: 'text' }, { name: 'brandProfile', type: 'relationship', relationTo: 'brand-profiles' }, { name: 'layout', type: 'json' },
  ] },
  { slug: 'brand-profiles', access: editorialAccess, fields: [
    { name: 'colors', type: 'json' }, { name: 'usageWeights', type: 'json' }, { name: 'motion', type: 'json' },
  ] },
]

export const captureRecoveryPreview = async (fixture, owner, media, seedFields = {}) => {
  const payload = fixture.payload
  const brand = await payload.create({ collection: 'brand-profiles', user: owner, overrideAccess: false, data: {
    ...seedFields.brand,
    colors: [{ role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' }],
    usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } })
  const page = await payload.create({ collection: 'pages', user: owner, overrideAccess: false, draft: true,
    data: { title: 'Frozen object recovery', brandProfile: brand.id, layout: [{ blockType: 'hero', image: media.id }], ...seedFields.page } })
  const snapshot = await createPagePreviewSnapshot({ payload, req: await createLocalReq({ user: owner }, payload), pageId: page.id })
  assert.equal(snapshot.manifest.mediaReferences[0].storageRevision, media.storageRevision)
  assert.equal(snapshot.manifest.mediaReferences[0].storage, 'versioned')
  const audits = await payload.find({ collection: 'audit-events', user: owner, overrideAccess: false, depth: 0, limit: 100 })
  assert.equal(audits.totalDocs, 1)
  assert.equal(audits.docs[0].action, 'preview.snapshot.created')
  return { id: snapshot.id, pageId: page.id, brandId: brand.id, manifest: snapshot.manifest, hash: snapshot.manifestHash, auditId: audits.docs[0].id }
}

export const verifyRecoveryPreview = async (fixture, owner, expected) => {
  const snapshot = await fixture.payload.findByID({ collection: 'preview-snapshots', id: expected.id, user: owner, overrideAccess: false, depth: 0 })
  assert.deepEqual(snapshot.manifest, expected.manifest, 'Frozen preview is not backfilled from current media')
  assert.equal(snapshot.manifestHash, expected.hash)
  assert.equal(String(snapshot.createdBy), String(owner.id))
  const visual = await loadSnapshotVisualPreview({ req: await createLocalReq({ user: owner }, fixture.payload), snapshotId: String(expected.id) })
  assert.equal(visual.title, 'Frozen object recovery')
  assert.equal(visual.blocks[0].type, 'hero')
  assert.equal(visual.warnings.length, 0, 'Real captured brand and media project without current data')
  const mediaId = expected.manifest.mediaReferences[0].id
  assert.equal(visual.assets[mediaId].url, `/api/media/snapshot/${expected.id}/${mediaId}`)
  const audit = await fixture.payload.findByID({ collection: 'audit-events', id: expected.auditId, user: owner, overrideAccess: false, depth: 0 })
  assert.equal(audit.action, 'preview.snapshot.created')
  assert.equal(String(audit.subjectId), String(expected.pageId))
  assert.equal(audit.metadata.manifestHash, expected.hash)
  const page = await fixture.payload.findByID({ collection: 'pages', id: expected.pageId, user: owner, overrideAccess: false, draft: true, depth: 0 })
  assert.equal(String(page.brandProfile), String(expected.brandId))
  assert.equal(page.title, 'Frozen object recovery')
  for (const route of [`/api/preview-snapshots/${expected.id}`, `/api/audit-events/${expected.auditId}`]) {
    assert([401, 403, 404].includes((await fixture.request(route, {}, false)).status), 'Private snapshot and audit are not anonymous content')
  }
}
