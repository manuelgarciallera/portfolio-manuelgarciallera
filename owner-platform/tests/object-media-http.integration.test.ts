import { readdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'
import { startObjectProviderFixture } from './media/object-provider-fixture'

// This small provider fixture exercises real Payload REST + S3 SDK end to end.
// The separate transport suite supplies timeouts and ambiguous-response faults.
let provider: Awaited<ReturnType<typeof startObjectProviderFixture>>
let objects: Map<string, Buffer>
let storage: Awaited<ReturnType<typeof startObjectProviderFixture>>['storage']
let fixture: MediaHTTPFixture

beforeAll(async () => {
  provider = await startObjectProviderFixture()
  objects = provider.objects
  storage = provider.storage
  fixture = await startMediaHTTPFixture(undefined, storage)
}, 60_000)

afterAll(async () => {
  try { await fixture?.close() } finally {
    await provider?.close()
  }
})

const upload = async () => {
  const bytes = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#224488' } }).png().toBuffer()
  const form = new FormData()
  form.set('_payload', JSON.stringify({ alt: 'Synthetic object media', _status: 'published' }))
  form.set('file', new File([bytes], `object-${randomUUID()}.png`, { type: 'image/png' }))
  return fixture.request('/api/media', { method: 'POST', body: form })
}

it('uploads, crops, restores and revokes object-backed media through authenticated Payload REST', async () => {
  const response = await upload()
  expect(response.status).toBe(201)
  const original = (await response.json()).doc
  const originalFiles = await storage.read(original.storageRevision)
  expect(originalFiles.length).toBeGreaterThan(1)
  const versions = await fixture.payload.findVersions({ collection: 'media', overrideAccess: true,
    where: { parent: { equals: original.id } }, sort: '-createdAt' })
  const query = new URLSearchParams({ 'uploadEdits[crop][height]': '50', 'uploadEdits[crop][width]': '50',
    'uploadEdits[crop][x]': '25', 'uploadEdits[crop][y]': '25', 'uploadEdits[heightInPixels]': '400', 'uploadEdits[widthInPixels]': '600' })
  const croppedResponse = await fixture.request(`/api/media/${original.id}?${query}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alt: original.alt, _status: 'published' }),
  })
  expect(croppedResponse.status).toBe(200)
  const cropped = (await croppedResponse.json()).doc
  expect(cropped).toMatchObject({ width: 600, height: 400 })
  expect(cropped.storageRevision).not.toBe(original.storageRevision)
  expect(await storage.read(original.storageRevision)).toEqual(originalFiles)
  expect((await fixture.request(original.url, {}, false)).status).toBe(404)
  const history = await fixture.request(original.url)
  expect(history.status).toBe(200)
  expect(Buffer.from(await history.arrayBuffer())).toEqual(originalFiles.find((entry) => entry.name === original.filename)!.bytes)
  const restore = () => fixture.request(`/api/media/versions/${versions.docs[0].id}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  })
  const restoredResponse = await restore()
  expect(restoredResponse.status).toBe(200)
  expect(await restoredResponse.json()).toMatchObject({ storageRevision: original.storageRevision, width: 1200, height: 800 })
  for (const file of originalFiles) {
    const url = `/api/media/revision/${original.id}/${original.storageRevision}/${encodeURIComponent(file.name)}`
    const download = await fixture.request(url, {}, false)
    expect(download.status).toBe(200)
    expect(Buffer.from(await download.arrayBuffer())).toEqual(file.bytes)
  }
  const corruptKey = `cms-media/${original.storageRevision}/files/0`
  const valid = objects.get(corruptKey)!
  objects.set(corruptKey, Buffer.from('corrupt'))
  expect((await restore()).status).toBeGreaterThanOrEqual(400)
  expect((await fixture.request(original.url)).status).toBe(404)
  objects.set(corruptKey, valid)
  const revoked = await fixture.request(`/api/media/${original.id}`, { method: 'DELETE' })
  expect(revoked.status).toBe(200)
  expect((await fixture.request(original.url)).status).toBe(404)
  expect(await storage.read(original.storageRevision)).toEqual(originalFiles)
  expect(await readdir(fixture.staticDir)).toEqual([])
  expect(await readdir(fixture.revisionRoot)).toEqual([])
}, 30_000)

it('does not create a media document when object writes fail', async () => {
  const before = await fixture.payload.count({ collection: 'media', overrideAccess: true })
  provider.failures.writes = true
  try {
    expect((await upload()).status).toBeGreaterThanOrEqual(400)
    expect((await fixture.payload.count({ collection: 'media', overrideAccess: true })).totalDocs).toBe(before.totalDocs)
  } finally { provider.failures.writes = false }
})

it.each(['create', 'update'] as const)('rolls back %s after successful object writes while retaining private recoverable bytes', async (operation) => {
  const original = operation === 'update' ? (await (await upload()).json()).doc : undefined
  const docsBefore = await fixture.payload.count({ collection: 'media', overrideAccess: true })
  const versionsBefore = await fixture.payload.findVersions({ collection: 'media', overrideAccess: true, pagination: false })
  const objectsBefore = new Set(objects.keys())
  const input = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#88cc22' } }).png().toBuffer()
  const form = new FormData()
  form.set('_payload', JSON.stringify({ alt: 'Must roll back after object write', _status: 'published' }))
  form.set('file', new File([input], original?.filename ?? `failed-${randomUUID()}.png`, { type: 'image/png' }))
  let failedDocument: { id: string | number; filename: string; storageRevision: string } | undefined
  let completeBytes: { name: string; bytes: Buffer }[] = []
  const hooks = fixture.payload.collections.media.config.hooks.afterChange
  const failureHook: (typeof hooks)[number] = async ({ doc }) => {
    failedDocument = { id: doc.id, filename: doc.filename, storageRevision: doc.storageRevision }
    // The failure occurs after Payload has a persisted document in its transaction
    // and after every binary and manifest has reached the provider.
    completeBytes = await storage.read(doc.storageRevision)
    throw new Error('Synthetic failure after complete object write')
  }
  hooks.push(failureHook)
  try {
    const response = await fixture.request(original ? `/api/media/${original.id}` : '/api/media', {
      method: original ? 'PATCH' : 'POST', body: form,
    })
    expect(response.status).toBe(500)
  } finally {
    const index = hooks.indexOf(failureHook)
    if (index < 0) throw new Error('Fixture failure hook disappeared')
    hooks.splice(index, 1)
  }
  expect(failedDocument).toBeDefined()
  const failed = failedDocument!
  expect(completeBytes.length).toBeGreaterThan(1)
  expect(completeBytes.find((file) => file.name === failed.filename)!.bytes).toEqual(input)
  expect((await fixture.payload.count({ collection: 'media', overrideAccess: true })).totalDocs).toBe(docsBefore.totalDocs)
  const versionsAfter = await fixture.payload.findVersions({ collection: 'media', overrideAccess: true, pagination: false })
  expect(versionsAfter.docs.map((version) => version.id).sort()).toEqual(versionsBefore.docs.map((version) => version.id).sort())
  if (original) {
    const current = await fixture.payload.findByID({ collection: 'media', id: original.id, overrideAccess: true })
    expect(current).toMatchObject({ alt: original.alt, storageRevision: original.storageRevision, filename: original.filename })
    expect((await fixture.request(original.url, {}, false)).status).toBe(200)
  } else {
    expect((await fixture.request(`/api/media/${failed.id}`)).status).toBe(404)
  }
  expect([...objects.keys()].filter((key) => !objectsBefore.has(key)).sort()).toEqual([
    ...completeBytes.map((_, index) => `cms-media/${failed.storageRevision}/files/${index}`),
    `cms-media/${failed.storageRevision}/manifest.json`,
  ].sort())
  expect(await storage.read(failed.storageRevision)).toEqual(completeBytes)
  for (const file of completeBytes) {
    const url = `/api/media/revision/${failed.id}/${failed.storageRevision}/${encodeURIComponent(file.name)}`
    expect((await fixture.request(url)).status).toBe(404)
    expect((await fixture.request(url, {}, false)).status).toBe(404)
  }
  // A later successful upload gets its own revision, never silently adopts the orphan.
  const retry = await upload()
  expect(retry.status).toBe(201)
  expect((await retry.json()).doc.storageRevision).not.toBe(failed.storageRevision)
  expect(await storage.read(failed.storageRevision)).toEqual(completeBytes)
}, 30_000)
