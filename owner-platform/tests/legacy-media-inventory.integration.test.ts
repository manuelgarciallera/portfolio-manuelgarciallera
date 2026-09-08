import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import {
  buildConfig,
  createLocalReq,
  getPayload,
  type CollectionConfig,
  type Payload,
  type PayloadRequest,
} from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { AuditEvents } from '../src/collections/AuditEvents'
import { Media } from '../src/collections/Media'
import { PreviewSnapshots } from '../src/collections/PreviewSnapshots'
import { Users } from '../src/collections/Users'
import { editorialAccess, editorialVersions } from '../src/collections/shared'
import { inspectPayloadLegacyMedia } from '../src/media/legacy-media-inventory-service'
import type { LegacyMediaInventory } from '../src/media/legacy-media-inventory'
import type { Media as MediaDocument, PreviewSnapshot } from '../src/payload-types'
import { createPagePreviewSnapshot } from '../src/preview/service'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'

let payload: Payload
let owner: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>
let nonOwner: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>
let ownerReq: PayloadRequest
let mediaRoot: string
let denyVersions = false
let original: MediaDocument
let replacement: MediaDocument
let draft: MediaDocument
let trashed: MediaDocument
let snapshot: PreviewSnapshot
let redVersionID: string
let blueOriginalSHA256: string
let emptyInventory: LegacyMediaInventory
let expectedVersionIdentities: Array<{ documentId: string; referenceId: string }>
const key = `legacy-media-inventory-${randomUUID()}`

const fixtureUsers: CollectionConfig = {
  ...Users,
  fields: Users.fields.map((field) => 'name' in field && field.name === 'role'
    ? { ...field, options: [
      { label: 'Owner', value: 'owner' },
      { label: 'Editor fixture', value: 'editor' },
    ] }
    : field),
}

const file = async (background: string, name: string) => {
  const data = await sharp({
    create: { width: 1700, height: 1100, channels: 3, background },
  }).png().toBuffer()
  return { data, name, mimetype: 'image/png', size: data.length }
}

const sortedRows = async (kind: 'draft' | 'published' | 'snapshot' | 'version') => {
  if (kind === 'version') return (await payload.findVersions({
    collection: 'media', depth: 0, limit: 100, overrideAccess: true,
    pagination: true, page: 1, sort: 'id', trash: true,
  })).docs
  if (kind === 'snapshot') return (await payload.find({
    collection: 'preview-snapshots', depth: 0, limit: 100, overrideAccess: true,
    pagination: true, page: 1, sort: 'id',
  })).docs
  return (await payload.find({
    collection: 'media', depth: 0, draft: kind === 'draft', limit: 100,
    overrideAccess: true, pagination: true, page: 1, sort: 'id', trash: true,
  })).docs
}

const databaseSnapshot = async () => JSON.stringify({
  published: await sortedRows('published'),
  draft: await sortedRows('draft'),
  versions: await sortedRows('version'),
  snapshots: await sortedRows('snapshot'),
})

const physicalSnapshot = async () => {
  const entries = (await readdir(mediaRoot, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name))
  const result: Array<{ name: string; sha256: string }> = []
  for (const entry of entries) {
    if (!entry.isFile()) throw new Error('The synthetic media fixture must remain flat.')
    const bytes = await readFile(path.join(mediaRoot, entry.name))
    result.push({ name: entry.name, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
  return result
}

beforeAll(async () => {
  const database = await editorialDatabaseConfig(process.env, {
    cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)),
  })
  const root = process.env.OWNER_INTEGRATION_DIRECTORY!
  mediaRoot = path.join(root, 'legacy-media-inventory-files')
  await mkdir(mediaRoot)
  const originalReadVersions = Media.access!.readVersions!
  const fixtureMedia: CollectionConfig = {
    ...Media,
    access: {
      ...Media.access,
      readVersions: (args) => denyVersions
        ? false
        : typeof originalReadVersions === 'function' ? originalReadVersions(args) : originalReadVersions,
    },
    upload: { ...Media.upload as object, staticDir: mediaRoot },
  }
  const config = await buildConfig({
    collections: [
      fixtureUsers,
      fixtureMedia,
      PreviewSnapshots,
      AuditEvents,
      {
        slug: 'pages', access: editorialAccess, versions: editorialVersions,
        fields: [
          { name: 'title', type: 'text' },
          { name: 'brandProfile', type: 'relationship', relationTo: 'brand-profiles' },
          { name: 'layout', type: 'json' },
        ],
      },
      {
        slug: 'brand-profiles', access: editorialAccess,
        fields: [
          { name: 'colors', type: 'json' },
          { name: 'usageWeights', type: 'json' },
          { name: 'motion', type: 'json' },
        ],
      },
    ],
    db: database.engine === 'postgres'
      ? postgresAdapter({
        pool: database.pool,
        push: true,
        disableCreateDatabase: true,
        schemaName: 'legacy_media_inventory_fixture',
      })
      : sqliteAdapter({
        client: { url: `file:${path.join(root, 'legacy-media-inventory.db').replaceAll('\\', '/')}` },
        transactionOptions: {},
      }),
    secret: randomUUID() + randomUUID(),
    sharp,
    graphQL: { disable: true },
  })
  payload = await getPayload({ config, key })

  const ownerEmail = `legacy-owner-${randomUUID()}@example.invalid`
  const ownerPassword = randomUUID() + randomUUID()
  await payload.create({
    collection: 'users', overrideAccess: true,
    data: { email: ownerEmail, password: ownerPassword, role: 'owner' },
  })
  const ownerLogin = await payload.login({
    collection: 'users', data: { email: ownerEmail, password: ownerPassword },
  })
  owner = (await payload.auth({
    headers: new Headers({ Authorization: `JWT ${ownerLogin.token!}` }),
  })).user!
  ownerReq = await createLocalReq({ user: owner }, payload)

  const editorEmail = `legacy-editor-${randomUUID()}@example.invalid`
  const editorPassword = randomUUID() + randomUUID()
  await payload.create({
    collection: 'users', overrideAccess: true,
    data: { email: editorEmail, password: editorPassword, role: 'editor' } as never,
  })
  const editorLogin = await payload.login({
    collection: 'users', data: { email: editorEmail, password: editorPassword },
  })
  nonOwner = (await payload.auth({
    headers: new Headers({ Authorization: `JWT ${editorLogin.token!}` }),
  })).user!

  emptyInventory = await inspectPayloadLegacyMedia({ payload, req: ownerReq, root: mediaRoot })

  const red = await file('#ff0000', 'legacy-replace.png')
  original = await payload.create({
    collection: 'media', overrideAccess: false, user: owner,
    data: { alt: 'Synthetic red A', _status: 'published' }, file: red,
  })
  const brand = await payload.create({
    collection: 'brand-profiles', overrideAccess: false, user: owner,
    data: {
      colors: [
        { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
        { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
        { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
        { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
      ],
      usageWeights: [
        { role: 'background', weight: 70 }, { role: 'surface', weight: 20 },
        { role: 'text', weight: 8 }, { role: 'accent', weight: 2 },
      ],
      motion: {
        duration: 600, stagger: 80, travel: 24,
        easing: 'ease-out', reducedMotion: 'reduce',
      },
    } as never,
  })
  const page = await payload.create({
    collection: 'pages', draft: true, overrideAccess: false, user: owner,
    data: {
      title: 'Legacy capture', brandProfile: brand.id,
      layout: [{ blockType: 'hero', image: original.id }],
    } as never,
  })
  snapshot = await createPagePreviewSnapshot({ payload, req: ownerReq, pageId: page.id })
  const versionsWithA = await payload.findVersions({
    collection: 'media', depth: 0, overrideAccess: false, req: ownerReq,
    sort: 'id', trash: true, where: { parent: { equals: original.id } },
  })
  const redVersion = versionsWithA.docs.find((entry) => entry.version.alt === 'Synthetic red A')
  if (!redVersion) throw new Error('Synthetic red A version was not retained.')
  redVersionID = String(redVersion.id)

  const blue = await file('#0000ff', String(original.filename))
  blueOriginalSHA256 = createHash('sha256').update(blue.data).digest('hex')
  replacement = await payload.update({
    collection: 'media', id: original.id, overrideAccess: false, user: owner,
    overwriteExistingFiles: true, data: { alt: 'Synthetic blue B' }, file: blue,
  })
  draft = await payload.create({
    collection: 'media', draft: true, overrideAccess: false, user: owner,
    data: { alt: 'Synthetic draft', _status: 'draft' },
    file: await file('#00ff00', 'legacy-draft.png'),
  })
  trashed = await payload.create({
    collection: 'media', overrideAccess: false, user: owner,
    data: { alt: 'Synthetic trash', _status: 'published' },
    file: await file('#ffff00', 'legacy-trash.png'),
  })
  trashed = await payload.update({
    collection: 'media', id: trashed.id, overrideAccess: false, user: owner,
    data: { deletedAt: new Date('2026-09-08T00:00:00.000Z').toISOString() },
  })
  const seededVersions = await sortedRows('version') as Array<{
    id: number | string
    parent: number | string | { id: number | string }
  }>
  expectedVersionIdentities = seededVersions.map((version) => ({
    documentId: String(typeof version.parent === 'object' ? version.parent.id : version.parent),
    referenceId: String(version.id),
  })).sort((left, right) => left.documentId.localeCompare(right.documentId)
    || left.referenceId.localeCompare(right.referenceId))
}, 60_000)

afterAll(async () => {
  const database = payload?.db as unknown as { name?: string; client?: { close(): void } }
  await payload?.destroy()
  if (database?.name === 'sqlite') database.client?.close()
})

describe('Payload legacy media inventory', () => {
  it('reads a real owner fixture without changing rows, versions, snapshots or physical bytes', async () => {
    const databaseBefore = await databaseSnapshot()
    const filesBefore = await physicalSnapshot()
    const snapshotHash = snapshot.manifestHash

    const report = await inspectPayloadLegacyMedia({ payload, req: ownerReq, root: mediaRoot })

    expect(emptyInventory.references).toEqual([])
    expect(emptyInventory.physicalFiles).toEqual([])
    expect(report.migrationReady).toBe(false)
    expect(report.references).toHaveLength(9)
    expect(report.references.filter(({ kind }) => kind === 'document').map(({ documentId }) => documentId))
      .toEqual([String(original.id), String(trashed.id)].sort())
    expect(report.references.filter(({ kind }) => kind === 'draft').map(({ documentId }) => documentId))
      .toEqual([String(draft.id)])
    expect(report.references.filter(({ kind }) => kind === 'snapshot').map(({ documentId, referenceId }) => ({
      documentId, referenceId,
    }))).toEqual([{ documentId: String(original.id), referenceId: String(snapshot.id) }])
    const versionIdentities = report.references.filter(({ kind }) => kind === 'version')
      .map(({ documentId, referenceId }) => ({ documentId, referenceId }))
    expect(expectedVersionIdentities).toHaveLength(5)
    expect(expectedVersionIdentities.map(({ documentId }) => documentId).sort()).toEqual([
      String(original.id), String(original.id), String(draft.id),
      String(trashed.id), String(trashed.id),
    ].sort())
    expect(versionIdentities).toHaveLength(5)
    expect(versionIdentities).toEqual(expectedVersionIdentities)
    const current = report.references.find(({ kind, documentId }) =>
      kind === 'document' && documentId === String(replacement.id))!
    expect(current.state).toBe('published')
    expect(current.status).toBe('current-observed')
    expect(current.observedFiles.find(({ filename }) => filename === replacement.filename)).toMatchObject({
      status: 'present', sha256: blueOriginalSHA256,
    })
    const captured = report.references.find(({ kind }) => kind === 'snapshot')!
    expect(captured.files).toEqual([{ variant: 'original', filename: original.filename }])
    expect(captured.status).toBe('historical-unverified')
    expect(captured.observedFiles[0]).toMatchObject({ sha256: blueOriginalSHA256 })
    const historicalA = report.references.find(({ kind, referenceId }) =>
      kind === 'version' && referenceId === redVersionID)!
    expect(historicalA.status).toBe('historical-unverified')
    expect(historicalA.observedFiles.find(({ filename }) => filename === original.filename))
      .toMatchObject({ sha256: blueOriginalSHA256 })
    expect(report.references.find(({ kind, documentId }) =>
      kind === 'document' && documentId === String(trashed.id))?.state).toBe('trashed')
    expect(snapshot.manifestHash).toBe(snapshotHash)
    expect(await databaseSnapshot()).toBe(databaseBefore)
    expect(await physicalSnapshot()).toEqual(filesBefore)
  }, 30_000)

  it('rejects real anonymous and persisted non-owner requests before a missing root is read', async () => {
    const databaseBefore = await databaseSnapshot()
    const filesBefore = await physicalSnapshot()
    for (const req of [
      await createLocalReq({}, payload),
      await createLocalReq({ user: nonOwner }, payload),
    ]) {
      await expect(inspectPayloadLegacyMedia({
        payload, req, root: path.join(mediaRoot, 'must-not-be-read'),
      })).rejects.toMatchObject({ status: 403 })
    }
    expect(await databaseSnapshot()).toBe(databaseBefore)
    expect(await physicalSnapshot()).toEqual(filesBefore)
  })

  it('rejects an active request unchanged before IO and propagates readVersions denial', async () => {
    const databaseBefore = await databaseSnapshot()
    const filesBefore = await physicalSnapshot()
    const transactionID = new Promise<string>(() => undefined)
    const transactionalReq = await createLocalReq({ user: owner }, payload)
    transactionalReq.transactionID = transactionID
    await expect(inspectPayloadLegacyMedia({
      payload, req: transactionalReq, root: path.join(mediaRoot, 'must-not-be-read'),
    })).rejects.toMatchObject({ status: 409 })
    expect(transactionalReq.transactionID).toBe(transactionID)

    denyVersions = true
    try {
      await expect(inspectPayloadLegacyMedia({
        payload, req: await createLocalReq({ user: owner }, payload), root: mediaRoot,
      })).rejects.toMatchObject({ status: 403 })
    } finally {
      denyVersions = false
    }
    expect(await databaseSnapshot()).toBe(databaseBefore)
    expect(await physicalSnapshot()).toEqual(filesBefore)
  })
})
