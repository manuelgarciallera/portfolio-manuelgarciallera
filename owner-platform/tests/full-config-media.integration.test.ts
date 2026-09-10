import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it, vi } from 'vitest'
import { readdir } from 'node:fs/promises'
import sharp from 'sharp'
import { createLocalReq } from 'payload'
vi.mock('server-only', () => ({}))
import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'
import { createPagePreviewSnapshot } from '../src/preview/service'
import { createPageDraftSnapshot } from '../src/recovery/service'
import { createOwnerRelease } from '../src/releases/service'
import { prepareOwnerRestorePlan } from '../src/restore/prepare'
import { confirmOwnerRestorePlan } from '../src/restore/service'
import { executeOwnerRestorePlan } from '../src/restore/execute'
import { loadPageVisualPreview } from '../src/preview/visual-service'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
import { startObjectProviderFixture } from './media/object-provider-fixture'

let fixture: MediaHTTPFixture | undefined
let provider: Awaited<ReturnType<typeof startObjectProviderFixture>> | undefined
afterEach(async () => { try { await fixture?.close() } finally { fixture = undefined; await provider?.close(); provider = undefined } })
it.each(['filesystem', 'objects'] as const)('edits and restores a real CMS page with full owner configuration over %s', async transport => {
  const directory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit isolated QA directory required')
  const root = path.join(directory, `full-config-${randomUUID()}`)
  const selected = await editorialDatabaseConfig(process.env, {
    cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)),
  })
  provider = transport === 'objects' ? await startObjectProviderFixture() : undefined
  // Payload caches rawTables globally, without the database/schema identity.
  // Both isolated cases need their own initial schema; never use this at runtime.
  const previousPush = process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
  process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
  try { fixture = await startMediaHTTPFixture({ root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'scratch'),
    credentials: { email: 'full-config@example.invalid', password: randomUUID() + randomUUID() },
    secret: randomUUID() + randomUUID(), seed: true,
    database: selected.engine === 'postgres' ? { engine: 'postgres', pool: selected.pool }
      : { engine: 'sqlite', filename: path.join(root, 'full.db') }, fullOwnerConfig: true,
    schemaName: `full_owner_${transport}_http_fixture` }, provider?.storage)
  } finally {
    if (previousPush === undefined) delete process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
    else process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = previousPush
  }
  expect(fixture.payload.db.name).toBe(process.env.OWNER_INTEGRATION_ENGINE === 'postgres' ? 'postgres' : 'sqlite')
  const body = new FormData()
  const bytes = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#2255aa' } }).png().toBuffer()
  body.set('_payload', JSON.stringify({ alt: 'Synthetic full CMS image', _status: 'published' }))
  body.set('file', new File([new Uint8Array(bytes)], 'full.png', { type: 'image/png' }))
  const uploaded = await fixture.request('/api/media', { method: 'POST', body })
  expect(uploaded.status).toBe(201)
  const media = (await uploaded.json()).doc
  expect(media.url).toContain('/api/media/revision/')
  const saved = await fixture.request('/api/pages?draft=true', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Full configuration draft', slug: 'full-config-draft', layout: [{ blockType: 'hero', heading: 'Synthetic editorial page', image: media.id }] }) })
  expect(saved.status).toBe(201)
  const page = (await saved.json()).doc
  const read = await fixture.request(`/api/pages/${page.id}?draft=true`)
  const document = await read.json()
  expect(document.title).toBe('Full configuration draft')
  expect(document.layout[0].image.id).toBe(media.id)
  expect(document.layout[0].image.url).toBe(media.url)
  const image = await fixture.request(media.url)
  expect(image.status).toBe(200)
  expect(Buffer.from(await image.arrayBuffer())).toEqual(bytes)

  const { user } = await fixture.payload.auth({ headers: new Headers({ Cookie: fixture.cookie }) })
  expect(user?.role).toBe('owner')
  if (!user) throw new Error('Authenticated owner required')
  const req = await createLocalReq({ user }, fixture.payload)
  const brand = await fixture.payload.create({ collection: 'brand-profiles', req, overrideAccess: false, data: {
    name: 'Synthetic brand', slug: 'synthetic-brand', _status: 'published',
    colors: [
      { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
    ],
    usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } })
  await fixture.payload.update({ collection: 'pages', id: page.id, draft: true, req, overrideAccess: false, data: { brandProfile: brand.id } })
  const first = await createPagePreviewSnapshot({ payload: fixture.payload, req, pageId: page.id })
  expect(first.manifest).toHaveProperty('mediaReferences.0.storageRevision', media.storageRevision)
  const draftSnapshot = await createPageDraftSnapshot({ payload: fixture.payload as never, req, pageId: page.id })
  const release = await createOwnerRelease({ payload: fixture.payload as never, req, input: {
    name: 'Before media replacement', changeSummary: 'Synthetic restore target',
    gitCommit: 'a'.repeat(40), previewSnapshot: first.id, draftSnapshot: draftSnapshot.id,
    quality: [{ viewport: 'desktop', performance: 80, usability: 80, accessibility: 80, source: 'manual', measuredAt: '2026-09-10T08:00:00.000Z' }],
  } })
  const replacementBytes = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#ff5500' } }).png().toBuffer()
  const replacementBody = new FormData()
  replacementBody.set('_payload', JSON.stringify({ alt: 'Replacement image' }))
  replacementBody.set('file', new File([new Uint8Array(replacementBytes)], media.filename, { type: 'image/png' }))
  const replaced = await fixture.request(`/api/media/${media.id}`, { method: 'PATCH', body: replacementBody })
  expect(replaced.status).toBe(200)
  const replacement = (await replaced.json()).doc
  expect(replacement.storageRevision).not.toBe(media.storageRevision)
  const second = await createPagePreviewSnapshot({ payload: fixture.payload, req, pageId: page.id })
  expect(second.manifest).toHaveProperty('mediaReferences.0.storageRevision', replacement.storageRevision)
  const stored = await fixture.payload.findByID({ collection: 'preview-snapshots', id: first.id, req, overrideAccess: false })
  expect(stored.manifest).toEqual(first.manifest)
  expect(Buffer.from(await (await fixture.request(media.url)).arrayBuffer())).toEqual(bytes)
  expect(Buffer.from(await (await fixture.request(replacement.url)).arrayBuffer())).toEqual(replacementBytes)
  await fixture.payload.db.deleteVersions({ collection: 'media', where: { and: [
    { parent: { equals: media.id } }, { 'version.storageRevision': { equals: media.storageRevision } },
  ] } })
  expect((await fixture.request(media.url)).status).toBe(404)
  await fixture.payload.update({ collection: 'pages', id: page.id, req, overrideAccess: false, data: { _status: 'published' } })
  const publishedPage = await fixture.payload.findByID({ collection: 'pages', id: page.id, draft: false, depth: 0, req, overrideAccess: false })
  const plan = await prepareOwnerRestorePlan({ payload: fixture.payload as never, req, releaseId: String(release.id) })
  expect(plan.status).toBe('ready')
  const baseline = await createPagePreviewSnapshot({ payload: fixture.payload, req, pageId: page.id })
  await confirmOwnerRestorePlan({ payload: fixture.payload as never, req, planId: String(plan.id), currentSnapshot: baseline.id, confirmation: 'CONFIRMAR RESTAURACIÓN' })
  await executeOwnerRestorePlan({ payload: fixture.payload as never, req, planId: String(plan.id), confirmation: 'EJECUTAR RESTAURACIÓN' })
  const restored = await createPagePreviewSnapshot({ payload: fixture.payload, req, pageId: page.id })
  expect(restored.manifest).toHaveProperty('mediaReferences.0.storageRevision', media.storageRevision)
  const visual = await loadPageVisualPreview({ payload: fixture.payload, req, pageId: String(page.id) })
  expect(visual.assets[String(media.id)].url).toBe(`/api/media/snapshot/${first.id}/${media.id}`)
  expect(Buffer.from(await (await fixture.request(visual.assets[String(media.id)].url)).arrayBuffer())).toEqual(bytes)
  expect(await fixture.payload.findByID({ collection: 'media', id: media.id, req, overrideAccess: false })).toHaveProperty('storageRevision', replacement.storageRevision)
  const forged = await fixture.request(`/api/pages/${page.id}?draft=true`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Edited after restoration', restoredMediaSnapshot: second.id }) })
  expect(forged.status).toBe(200)
  const afterEdit = await createPagePreviewSnapshot({ payload: fixture.payload, req, pageId: page.id })
  expect(afterEdit.manifest).toHaveProperty('mediaReferences.0.storageRevision', media.storageRevision)
  expect(afterEdit.manifest).toHaveProperty('pageTitle', 'Edited after restoration')
  const invalidEdit = await fixture.request(`/api/pages/${page.id}?draft=true`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useCurrentMedia: true, title: '' }) })
  expect(invalidEdit.status).toBe(400)
  const stillPinned = await loadPageVisualPreview({ payload: fixture.payload, req, pageId: String(page.id) })
  expect(stillPinned.assets[String(media.id)].url).toBe(`/api/media/snapshot/${first.id}/${media.id}`)
  const unpinned = await fixture.request(`/api/pages/${page.id}?draft=true`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useCurrentMedia: true, title: 'Current library selected' }) })
  expect(unpinned.status).toBe(200)
  const current = await loadPageVisualPreview({ payload: fixture.payload, req, pageId: String(page.id) })
  expect(current.assets[String(media.id)].url).toBe(replacement.url)
  expect(current.title).toBe('Current library selected')
  expect(Buffer.from(await (await fixture.request(current.assets[String(media.id)].url)).arrayBuffer())).toEqual(replacementBytes)
  expect(await fixture.payload.findByID({ collection: 'pages', id: page.id, draft: false, depth: 0, req, overrideAccess: false })).toEqual(publishedPage)
  expect((await fixture.payload.findByID({ collection: 'preview-snapshots', id: first.id, req, overrideAccess: false })).manifest).toEqual(first.manifest)
  if (provider) {
    // Catch accidental filesystem fallback even when the editorial path succeeds.
    expect(await readdir(fixture.staticDir)).toEqual([])
    expect(await readdir(fixture.revisionRoot)).toEqual([])
    expect((await provider.storage.read(media.storageRevision)).find(file => file.name === media.filename)?.bytes).toEqual(bytes)
    expect((await provider.storage.read(replacement.storageRevision)).find(file => file.name === replacement.filename)?.bytes).toEqual(replacementBytes)
    expect((await fixture.request(`/api/media/snapshot/${first.id}/${media.id}`, {}, false)).status).toBe(404)
  }
}, 60_000)
