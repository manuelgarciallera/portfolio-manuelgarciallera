import { randomUUID } from 'node:crypto'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig, createLocalReq, getPayload, handleEndpoints, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { Media } from '../src/collections/Media'
import { Users } from '../src/collections/Users'
import { PreviewSnapshots } from '../src/collections/PreviewSnapshots'
import { AuditEvents } from '../src/collections/AuditEvents'
import { editorialAccess, editorialVersions } from '../src/collections/shared'
import { createPagePreviewSnapshot } from '../src/preview/service'
import { readMediaRevision } from '../src/media/revision-store'
import { createRevisionStorageCollection } from '../src/media/revision-storage-binding'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
import { compensateFigmaFiles } from '../src/connectors/figma/import-file-compensation'

let payload: Payload
let owner: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>
let config: Awaited<ReturnType<typeof buildConfig>>
let token: string
let revisionRoot: string
let staticDir: string
let rejectAfterWrite = false
let denyRead = false
let denyVersions = false
const key = `versioned-media-${randomUUID()}`

beforeAll(async () => {
  const database = await editorialDatabaseConfig(process.env, {
    cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)),
  })
  const root = process.env.OWNER_INTEGRATION_DIRECTORY!
  revisionRoot = path.join(root, 'private-revisions')
  staticDir = path.join(root, 'unused-native-media')
  await mkdir(revisionRoot)
  await mkdir(staticDir)
  const bound = await createRevisionStorageCollection({ ...Media, access: { ...Media.access,
    read: (args) => denyRead ? false : Media.access!.read!(args),
    readVersions: (args) => denyVersions ? false : Media.access!.readVersions!(args),
  } }, { revisionRoot, staticDir })
  config = await buildConfig({
    collections: [Users, { ...bound, hooks: { ...bound.hooks, beforeChange: [...bound.hooks!.beforeChange!, ({ data }) => {
      if (rejectAfterWrite) throw new Error('Synthetic database failure after revision write')
      return data
    }] } }, PreviewSnapshots, AuditEvents,
    // Minimal persisted page/brand inputs for the real snapshot service. The
    // complete application's editorial schema remains in its separate gate.
    { slug: 'pages', access: editorialAccess, versions: editorialVersions, fields: [
      { name: 'title', type: 'text' }, { name: 'brandProfile', type: 'relationship', relationTo: 'brand-profiles' }, { name: 'layout', type: 'json' },
    ] },
    { slug: 'brand-profiles', access: editorialAccess, fields: [
      { name: 'colors', type: 'json' }, { name: 'usageWeights', type: 'json' }, { name: 'motion', type: 'json' },
    ] }],
    db: database.engine === 'postgres'
      ? postgresAdapter({ pool: database.pool, push: true, disableCreateDatabase: true, schemaName: 'versioned_media_fixture' })
      : sqliteAdapter({ client: { url: `file:${path.join(root, 'versioned-media.db').replaceAll('\\', '/')}` }, transactionOptions: {} }),
    secret: randomUUID() + randomUUID(), sharp,
    graphQL: { disable: true },
  })
  payload = await getPayload({ config, key })
  const email = 'versioned-owner@example.invalid'
  const password = randomUUID() + randomUUID()
  await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, role: 'owner' } })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  token = login.token!
  owner = (await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })).user!
}, 60_000)

afterAll(async () => {
  const database = payload?.db as unknown as { name?: string; client?: { close(): void } }
  await payload?.destroy()
  if (database?.name === 'sqlite') database.client?.close()
})

const file = async (background: string, name = 'same-name.png') => {
  const data = await sharp({ create: { width: 1700, height: 1100, channels: 3, background } }).png().toBuffer()
  return { data, name, mimetype: 'image/png', size: data.length }
}
const create = async (draft = false) => payload.create({ collection: 'media', draft, user: owner, overrideAccess: false,
  data: { alt: 'Synthetic image', _status: draft ? 'draft' : 'published' }, file: await file('#ff0000'),
})
const revision = (doc: object) => (doc as { storageRevision: string }).storageRevision
const request = (url: string, authenticated = true) => handleEndpoints({ config,
  payloadInstanceCacheKey: key,
  request: new Request(new URL(url, 'http://localhost'), { headers: authenticated ? { Authorization: `JWT ${token}` } : {} }),
})

it('retains and restores exact original and derivative bytes after same-name replacement', async () => {
  const original = await create()
  expect(revision(original)).toEqual(expect.any(String))
  const saved = await readMediaRevision(revisionRoot, revision(original))
  expect(saved).toHaveLength(4)
  expect(saved.find((entry) => entry.name === original.filename)?.bytes).toEqual((await file('#ff0000')).data)
  const versions = await payload.findVersions({ collection: 'media', user: owner, overrideAccess: false,
    where: { parent: { equals: original.id } }, depth: 0 })
  const replacement = await payload.update({ collection: 'media', id: original.id, user: owner, overrideAccess: false,
    data: { alt: 'Synthetic image' }, file: await file('#0000ff', original.filename!), overwriteExistingFiles: true,
  })
  expect(replacement.filename).toBe(original.filename)
  expect(revision(replacement)).not.toBe(revision(original))
  expect(await readMediaRevision(revisionRoot, revision(original))).toEqual(saved)
  const restored = await payload.restoreVersion({ collection: 'media', id: versions.docs[0].id, user: owner, overrideAccess: false })
  expect(revision(restored)).toBe(revision(original))
  expect(await readMediaRevision(revisionRoot, revision(restored))).toEqual(saved)
  for (const entry of saved) {
    const url = `/api/media/revision/${original.id}/${revision(original)}/${entry.name}`
    const response = await request(url)
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(entry.bytes)
  }
  expect(await readdir(staticDir)).toEqual([])
}, 30_000)

it('preserves metadata-only edits and retains unreferenced bytes after a failed update', async () => {
  const original = await create()
  const edited = await payload.update({ collection: 'media', id: original.id, user: owner, overrideAccess: false, data: { alt: 'Only metadata' } })
  expect(revision(edited)).toBe(revision(original))
  const versions = await payload.findVersions({ collection: 'media', where: { parent: { equals: original.id } }, user: owner, overrideAccess: false })
  const before = await readdir(revisionRoot)
  rejectAfterWrite = true
  try {
    await expect(payload.update({ collection: 'media', id: original.id, user: owner, overrideAccess: false,
      data: { alt: 'Must roll back' }, file: await file('#00ff00'),
    })).rejects.toThrow('Synthetic database failure')
  } finally { rejectAfterWrite = false }
  const current = await payload.findByID({ collection: 'media', id: original.id, user: owner, overrideAccess: false })
  expect(current.alt).toBe('Only metadata')
  expect(revision(current)).toBe(revision(original))
  expect((await payload.findVersions({ collection: 'media', where: { parent: { equals: original.id } }, user: owner, overrideAccess: false })).docs.map((entry) => entry.id)).toEqual(versions.docs.map((entry) => entry.id))
  const orphan = (await readdir(revisionRoot)).filter((entry) => !before.includes(entry))
  expect(orphan).toHaveLength(1)
  expect(await readMediaRevision(revisionRoot, orphan[0])).toHaveLength(4)
  expect((await request(`/api/media/revision/${original.id}/${orphan[0]}/${original.filename}`)).status).toBe(404)
}, 30_000)

it('keeps draft bytes private over a published image and authorizes only exact record/revision/file associations', async () => {
  const published = await create()
  const draft = await payload.update({ collection: 'media', id: published.id, draft: true, user: owner, overrideAccess: false,
    data: { alt: 'Private draft' }, file: await file('#00ff00', published.filename!), overwriteExistingFiles: true,
  })
  expect(revision(draft)).not.toBe(revision(published))
  expect((await request(published.url!, false)).status).toBe(200)
  expect((await request(draft.url!, false)).status).toBe(404)
  const response = await request(draft.url!)
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  const other = await create(true)
  expect((await request(other.url!, false)).status).toBe(404)
  expect((await request(`/api/media/revision/${other.id}/${revision(draft)}/${draft.filename}`)).status).toBe(404)
  expect((await request(`/api/media/revision/${draft.id}/${revision(draft)}/manifest.json`)).status).toBe(404)
  expect((await request(`/api/media/revision/${draft.id}/bad/${draft.filename}`)).status).toBe(404)
  expect((await request(`/api/media/file/${draft.filename}`)).status).toBe(404)
  denyVersions = true
  try { expect((await request(draft.url!)).status).toBe(404) } finally { denyVersions = false }
  denyRead = true
  try {
    expect((await request(published.url!)).status).toBe(404)
    expect((await request(draft.url!)).status).toBe(404)
  } finally { denyRead = false }
}, 30_000)

it('freezes exact revisions through real preview snapshot persistence after same-name replacement', async () => {
  const original = await create()
  const brand = await payload.create({ collection: 'brand-profiles', user: owner, overrideAccess: false, data: {
    colors: [{ role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' }],
    usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } as never })
  const page = await payload.create({ collection: 'pages', draft: true, user: owner, overrideAccess: false,
    data: { title: 'Captured image', brandProfile: brand.id, layout: [{ blockType: 'hero', image: original.id }] } as never,
  })
  const first = await createPagePreviewSnapshot({ payload, req: await createLocalReq({ user: owner }, payload), pageId: page.id })
  expect(first.manifest).toHaveProperty('mediaReferences.0.storage', 'versioned')
  expect(first.manifest).toHaveProperty('mediaReferences.0.storageRevision', revision(original))
  const replacement = await payload.update({ collection: 'media', id: original.id, user: owner, overrideAccess: false,
    overwriteExistingFiles: true, data: { alt: original.alt }, file: await file('#0000ff', original.filename!),
  })
  expect(replacement.filename).toBe(original.filename)
  const second = await createPagePreviewSnapshot({ payload, req: await createLocalReq({ user: owner }, payload), pageId: page.id })
  expect(second.manifestHash).not.toBe(first.manifestHash)
  expect(second.manifest).toHaveProperty('mediaReferences.0.storageRevision', revision(replacement))
  const stored = await payload.findByID({ collection: 'preview-snapshots', id: first.id, user: owner, overrideAccess: false })
  expect(stored.manifest).toEqual(first.manifest)
  expect((await request(original.url!, false)).status).toBe(404)
  expect((await request(original.url!)).status).toBe(200)
}, 30_000)

it('returns a closed response for corrupt revisions instead of a native file fallback', async () => {
  const original = await create()
  await writeFile(path.join(revisionRoot, revision(original), original.filename!), Buffer.from('synthetic corrupt bytes'))
  const response = await request(original.url!)
  expect(response).toBeInstanceOf(Response)
  expect(response.status).toBe(404)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
}, 30_000)

it('rejects forged revision and binary metadata even with restore context and a reused real restore request', async () => {
  const first = await create()
  const other = await create()
  const attempts = [{ storageRevision: revision(other) }, { storageRevision: null }, { filename: other.filename },
    { sizes: other.sizes }, { prefix: revision(other) }]
  for (const context of [{}, { isRestoringVersion: true }]) {
    for (const data of attempts) {
      const forgedReq = await createLocalReq({ user: owner, context }, payload)
      await expect(payload.update({ collection: 'media', id: first.id, req: forgedReq, overrideAccess: false, data: data as never })).rejects.toMatchObject({ status: 400 })
    }
  }
  const req = await createLocalReq({ user: owner }, payload)
  const versions = await payload.findVersions({ collection: 'media', where: { parent: { equals: first.id } }, user: owner, overrideAccess: false })
  await payload.restoreVersion({ collection: 'media', id: versions.docs[0].id, req, overrideAccess: false })
  await expect(payload.update({ collection: 'media', id: first.id, req, overrideAccess: false,
    data: { storageRevision: revision(other) } as never,
  })).rejects.toThrow()
  expect(revision(await payload.findByID({ collection: 'media', id: first.id, user: owner, overrideAccess: false }))).toBe(revision(first))
}, 30_000)

it('rejects revision reassignment through authenticated REST and anonymous writes', async () => {
  const original = await create()
  const other = await create()
  for (const authenticated of [true, false]) {
    const response = await handleEndpoints({ config, payloadInstanceCacheKey: key,
      request: new Request(`http://localhost/api/media/${original.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `JWT ${token}` } : {}) },
        body: JSON.stringify({ storageRevision: revision(other) }),
      }),
    })
    expect(response.status).toBe(authenticated ? 400 : 403)
  }
  expect(revision(await payload.findByID({ collection: 'media', id: original.id, user: owner, overrideAccess: false }))).toBe(revision(original))
}, 30_000)

it('treats trash/restore as metadata and retains Figma/history bytes after permanent deletion', async () => {
  const original = await create()
  const saved = await readMediaRevision(revisionRoot, revision(original))
  await payload.update({ collection: 'media', id: original.id, user: owner, overrideAccess: false,
    data: { deletedAt: new Date().toISOString() },
  })
  expect((await request(original.url!)).status).toBe(404)
  const restored = await payload.update({ collection: 'media', id: original.id, user: owner, overrideAccess: false, trash: true, data: { deletedAt: null } })
  expect(revision(restored)).toBe(revision(original))
  expect((await request(original.url!)).status).toBe(200)
  expect(await compensateFigmaFiles({ payload: payload as never, media: original as never, prefix: `figma-${randomUUID()}-` })).toEqual({ status: 'retained', reason: 'unsupported-storage', removed: 0 })
  await payload.delete({ collection: 'media', id: original.id, user: owner, overrideAccess: false })
  expect((await request(original.url!)).status).toBe(404)
  expect(await readMediaRevision(revisionRoot, revision(original))).toEqual(saved)
}, 30_000)
