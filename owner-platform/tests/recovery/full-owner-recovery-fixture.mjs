import assert from 'node:assert/strict'
import { createLocalReq } from 'payload'
import { captureRecoveryPreview } from './preview-recovery-fixture.mjs'
import { createPageDraftSnapshot } from '../../src/recovery/service.ts'
import { createOwnerRelease } from '../../src/releases/service.ts'
import { prepareOwnerRestorePlan } from '../../src/restore/prepare.ts'
import { confirmOwnerRestorePlan } from '../../src/restore/service.ts'
import { executeOwnerRestorePlan } from '../../src/restore/execute.ts'
import { createPagePreviewSnapshot } from '../../src/preview/service.ts'
import { loadPageVisualPreview } from '../../src/preview/visual-service.ts'
import { createRecoveryAdmissionStore } from '../../src/auth/recovery-admission.ts'

export const captureFullOwnerPreview = async (fixture, owner, media) => {
  const admission = createRecoveryAdmissionStore({ pool: fixture.payload.db.pool,
    secret: fixture.payload.config.secret, schemaName: 'public' })
  assert.equal(await admission.admit('backup-budget@example.invalid'), true, 'Seed a real persisted admission budget before backup')
  const snapshot = await captureRecoveryPreview(fixture, owner, media, {
    brand: { name: 'Recovery brand', slug: 'recovery-brand', _status: 'published' },
    page: { slug: 'recovery-page', layout: [{ blockType: 'hero', heading: 'Recovered editorial design', image: media.id }] },
  })
  const req = await createLocalReq({ user: owner }, fixture.payload)
  const draft = await createPageDraftSnapshot({ payload: fixture.payload, req, pageId: snapshot.pageId })
  const release = await createOwnerRelease({ payload: fixture.payload, req, input: {
    name: 'Synthetic recovery checkpoint', changeSummary: 'Before replacing the image',
    gitCommit: 'a'.repeat(40), previewSnapshot: snapshot.id, draftSnapshot: draft.id,
    // Synthetic QA values, not measured product scores.
    quality: [{ viewport: 'desktop', performance: 80, usability: 80, accessibility: 80, source: 'manual', measuredAt: '2026-09-10T08:00:00.000Z' }],
  } })
  return { ...snapshot, draftId: draft.id, releaseId: release.id }
}

export const prepareFullOwnerRecovery = async (fixture, owner, snapshot) => {
  const plan = await prepareOwnerRestorePlan({ payload: fixture.payload,
    req: await createLocalReq({ user: owner }, fixture.payload), releaseId: snapshot.releaseId })
  assert.equal(plan.status, 'ready')
  return { planId: plan.id }
}

export const readFullOwnerWorkflow = async (fixture, owner, snapshot, workflow) => {
  const common = { user: owner, overrideAccess: false, depth: 0 }
  const records = {}
  for (const [collection, id] of [['draft-snapshots', snapshot.draftId], ['releases', snapshot.releaseId], ['restore-plans', workflow.planId]]) {
    records[collection] = await fixture.payload.findByID({ ...common, collection, id })
    assert([401, 403, 404].includes((await fixture.request(`/api/${collection}/${id}`, {}, false)).status), 'Recovered workflow remains private')
  }
  // The native ledger is infrastructure-only, not an owner-editable collection.
  const ledger = await fixture.payload.find({ collection: 'payload-migrations', depth: 0, sort: 'id', limit: 100 })
  assert.equal(ledger.totalDocs, 3, 'All three native migrations survive recovery without replay')
  assert.deepEqual(ledger.docs.map(row => row.name).sort(), [
    '20260910_123524_owner_baseline', '20260910_133129_object_storage', '20260911_062311_recovery_admission',
  ])
  assert.equal(ledger.docs.length, ledger.totalDocs)
  records.ledger = ledger.docs
  records.admissionBudget = (await fixture.payload.db.pool.query('SELECT * FROM public.owner_recovery_admissions ORDER BY key')).rows
  assert.equal(records.admissionBudget.length, 2, 'Global and recipient admission state survive physical backup')
  assert(records.admissionBudget.every(row => row.attempts === 1))
  const audits = await fixture.payload.find({ ...common, collection: 'audit-events', sort: 'id', limit: 100 })
  assert.equal(audits.docs.length, audits.totalDocs)
  records.audits = audits.docs
  return JSON.parse(JSON.stringify(records))
}

export const executeRecoveredOwnerWorkflow = async (fixture, owner, snapshot, workflow) => {
  const payload = fixture.payload
  const req = await createLocalReq({ user: owner }, payload)
  const current = await createPagePreviewSnapshot({ payload, req, pageId: snapshot.pageId })
  const confirmed = await confirmOwnerRestorePlan({ payload, req, planId: workflow.planId,
    currentSnapshot: current.id, confirmation: 'CONFIRMAR RESTAURACIÓN' })
  assert.equal(confirmed.status, 'confirmed')
  const executed = await executeOwnerRestorePlan({ payload, req, planId: workflow.planId, confirmation: 'EJECUTAR RESTAURACIÓN' })
  assert.equal(executed.status, 'executed', 'Recovered plan can execute with real transactions')
  const restored = await createPagePreviewSnapshot({ payload, req, pageId: snapshot.pageId })
  assert.deepEqual(restored.manifest.mediaReferences, snapshot.manifest.mediaReferences, 'Restoration keeps the historical image instead of the current library')
  const updated = await fixture.request(`/api/pages/${snapshot.pageId}?draft=true`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Independent editorial edit after physical recovery' }),
  })
  assert.equal(updated.status, 200)
  assert.equal((await updated.json()).doc.title, 'Independent editorial edit after physical recovery')
  const visual = await loadPageVisualPreview({ payload, req, pageId: String(snapshot.pageId) })
  assert.equal(visual.title, 'Independent editorial edit after physical recovery')
  const mediaId = snapshot.manifest.mediaReferences[0].id
  assert.equal(visual.assets[mediaId].url, `/api/media/snapshot/${snapshot.id}/${mediaId}`)
  const resetTitle = await fixture.request(`/api/pages/${snapshot.pageId}?draft=true`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Frozen object recovery' }),
  })
  assert.equal(resetTitle.status, 200)
  return { planExecuted: true, pageEditedAfterRecovery: true }
}
