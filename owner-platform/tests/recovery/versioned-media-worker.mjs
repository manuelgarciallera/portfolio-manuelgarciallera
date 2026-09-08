import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { createLocalReq } from 'payload'
import sharp from 'sharp'
import { startMediaHTTPFixture } from '../media/http-fixture.ts'
import { PreviewSnapshots } from '../../src/collections/PreviewSnapshots.ts'
import { AuditEvents } from '../../src/collections/AuditEvents.ts'
import { editorialAccess, editorialVersions } from '../../src/collections/shared.ts'
import { createPagePreviewSnapshot } from '../../src/preview/service.ts'
import { readMediaRevision } from '../../src/media/revision-store.ts'
import { snapshotFiles } from './backup-manifest.mjs'
import { snapshotRevisionInventory, writeRevisionInventory } from './versioned-media-manifest.mjs'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const specs = {
  A: { width: 1920, height: 1200, color: '#ff0000', pixel: [255, 0, 0], sizes: [[480, 300], [960, 600], [1600, 1000]] },
  B: { width: 1920, height: 1440, color: '#0000ff', pixel: [0, 0, 255], sizes: [[480, 360], [960, 720], [1600, 1200]] },
  C: { width: 1920, height: 1080, color: '#00ff00', pixel: [0, 255, 0], sizes: [[480, 270], [960, 540], [1600, 900]] },
  orphan: { width: 1920, height: 1200, color: '#ffff00', pixel: [255, 255, 0], sizes: [[480, 300], [960, 600], [1600, 1000]] },
  foreign: { width: 1920, height: 1200, color: '#ff00ff', pixel: [255, 0, 255], sizes: [[480, 300], [960, 600], [1600, 1000]] },
}
const image = (spec) => sharp({ create: { width: spec.width, height: spec.height, channels: 3, background: spec.color } }).png().toBuffer()
const receipt = (doc) => ({ id: doc.id, revision: doc.storageRevision, filename: doc.filename,
  width: doc.width, height: doc.height, status: doc._status, alt: doc.alt })
const progress = (message) => process.send?.({ progress: `versioned:${message}` })
const collections = [PreviewSnapshots, AuditEvents,
  // Persisted inputs for the real preview service, deliberately scoped separately
  // from the legacy worker's full application-schema recovery gate.
  { slug: 'pages', access: editorialAccess, versions: editorialVersions, fields: [
    { name: 'title', type: 'text' }, { name: 'brandProfile', type: 'relationship', relationTo: 'brand-profiles' }, { name: 'layout', type: 'json' },
  ] },
  { slug: 'brand-profiles', access: editorialAccess, fields: [
    { name: 'colors', type: 'json' }, { name: 'usageWeights', type: 'json' }, { name: 'motion', type: 'json' },
  ] },
]

const upload = async (fixture, label, id, status = 'published', expectedStatus = id ? 200 : 201) => {
  const body = new FormData()
  body.set('_payload', JSON.stringify({ alt: `Recovery ${label}`, _status: status }))
  body.set('file', new File([await image(specs[label])], label === 'foreign' ? 'foreign.png' : 'recovery.png', { type: 'image/png' }))
  const response = await fixture.request(`/api/media${id ? `/${id}` : ''}${status === 'draft' ? '?draft=true' : ''}`, { body, method: id ? 'PATCH' : 'POST' })
  assert.equal(response.status, expectedStatus, `HTTP upload ${label}`)
  const result = await response.json()
  return result.doc
}

const revisionEvidence = async (fixture, doc, label) => {
  const spec = specs[label]
  assert.equal(doc.width, spec.width)
  assert.equal(doc.height, spec.height)
  const files = await readMediaRevision(fixture.revisionRoot, doc.storageRevision)
  assert.equal(files.length, 4, `${label}: original plus three derivatives`)
  const original = files.find((file) => file.name === doc.filename)
  assert(original, `${label}: exact original name present`)
  assert.deepEqual(original.bytes, await image(spec), `${label}: independently generated original bytes`)
  const sizes = []
  for (const file of files) {
    const metadata = await sharp(file.bytes).metadata()
    const pixels = await sharp(file.bytes).raw().toBuffer()
    assert.deepEqual([...pixels.subarray(0, 3)], spec.pixel, `${label}: expected RGB content`)
    if (file !== original) sizes.push([metadata.width, metadata.height])
    else assert.deepEqual([metadata.width, metadata.height], [spec.width, spec.height])
  }
  assert.deepEqual(sizes.sort((a, b) => a[0] - b[0]), spec.sizes, `${label}: literal derivative dimensions`)
  return { ...receipt(doc), files: files.map(({ name, bytes }) => ({ name, size: bytes.length, sha256: sha256(bytes) })).sort((a, b) => a.name.localeCompare(b.name, 'en')) }
}

const versionsFor = async (fixture, owner, id) => {
  const result = await fixture.payload.findVersions({ collection: 'media', user: owner, overrideAccess: false,
    where: { parent: { equals: id } }, depth: 0, limit: 100 })
  assert.equal(result.docs.length, result.totalDocs, 'All media versions must be inventoried')
  return result.docs.map(({ id, parent, version }) => ({ ...receipt(version), id, parent, versionId: id }))
    .sort((a, b) => Number(a.versionId) - Number(b.versionId))
}

const frozenSnapshot = async (fixture, owner, media) => {
  const payload = fixture.payload
  const brand = await payload.create({ collection: 'brand-profiles', user: owner, overrideAccess: false, data: {
    colors: [{ role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' }],
    usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } })
  const page = await payload.create({ collection: 'pages', user: owner, overrideAccess: false, draft: true,
    data: { title: 'Frozen recovery A', brandProfile: brand.id, layout: [{ blockType: 'hero', image: media.id }] } })
  const snapshot = await createPagePreviewSnapshot({ payload, req: await createLocalReq({ user: owner }, payload), pageId: page.id })
  assert.equal(snapshot.manifest.mediaReferences[0].storageRevision, media.storageRevision)
  assert.equal(snapshot.manifest.mediaReferences[0].storage, 'versioned')
  const audits = await payload.find({ collection: 'audit-events', user: owner, overrideAccess: false, depth: 0, limit: 100 })
  assert.equal(audits.totalDocs, 1)
  assert.equal(audits.docs[0].action, 'preview.snapshot.created')
  return { id: snapshot.id, pageId: page.id, brandId: brand.id, manifest: snapshot.manifest, hash: snapshot.manifestHash, auditIds: audits.docs.map(({ id }) => id) }
}

const assertHTTPFiles = async (fixture, mediaId, revision, authenticated, status) => {
  for (const file of revision.files) {
    const response = await fixture.request(`/api/media/revision/${mediaId}/${revision.revision}/${encodeURIComponent(file.name)}`, {}, authenticated)
    assert.equal(response.status, status, `HTTP ${revision.alt} ${file.name} auth=${authenticated}`)
    if (status === 200) {
      const bytes = Buffer.from(await response.arrayBuffer())
      assert.equal(bytes.length, file.size)
      assert.equal(sha256(bytes), file.sha256)
    }
  }
}
const assertAuthorization = async (fixture, expected) => {
  const { A, B, C, orphan, foreign } = expected.revisions
  for (const [revision, publicStatus] of [[A, 404], [B, 200], [C, 404]]) {
    await assertHTTPFiles(fixture, expected.mediaId, revision, true, 200)
    await assertHTTPFiles(fixture, expected.mediaId, revision, false, publicStatus)
  }
  await assertHTTPFiles(fixture, expected.mediaId, orphan, true, 404)
  await assertHTTPFiles(fixture, expected.mediaId, orphan, false, 404)
  await assertHTTPFiles(fixture, expected.mediaId, foreign, true, 404)
}

const seed = async (fixture, owner, setFailure, mediaDirectory) => {
  const a = await upload(fixture, 'A')
  const revisions = { A: await revisionEvidence(fixture, a, 'A') }
  const firstVersions = await versionsFor(fixture, owner, a.id)
  const versionA = firstVersions.find((version) => version.revision === a.storageRevision).versionId
  const snapshot = await frozenSnapshot(fixture, owner, a)
  const b = await upload(fixture, 'B', a.id)
  revisions.B = await revisionEvidence(fixture, b, 'B')
  const c = await upload(fixture, 'C', a.id, 'draft')
  revisions.C = await revisionEvidence(fixture, c, 'C')
  assert.equal(new Set([a.storageRevision, b.storageRevision, c.storageRevision]).size, 3)
  const foreign = await upload(fixture, 'foreign')
  revisions.foreign = await revisionEvidence(fixture, foreign, 'foreign')
  const before = await readdir(fixture.revisionRoot)
  const versions = await versionsFor(fixture, owner, a.id)
  setFailure(true)
  try { await upload(fixture, 'orphan', a.id, 'draft', 500) } finally { setFailure(false) }
  assert.deepEqual(await versionsFor(fixture, owner, a.id), versions, 'Failed DB update must roll back its version')
  const added = (await readdir(fixture.revisionRoot)).filter((id) => !before.includes(id))
  assert.equal(added.length, 1, 'One unreferenced post-write revision retained')
  const orphanFiles = await readMediaRevision(fixture.revisionRoot, added[0])
  const orphanOriginal = orphanFiles.find((file) => !/-\d+x\d+\./.test(file.name))
  assert(orphanOriginal)
  revisions.orphan = await revisionEvidence(fixture, { ...a, alt: 'Recovery orphan', filename: orphanOriginal.name, storageRevision: added[0] }, 'orphan')
  const emptyAttempt = randomUUID()
  await mkdir(path.join(fixture.revisionRoot, emptyAttempt))
  const inventory = await writeRevisionInventory(mediaDirectory)
  assert.equal(inventory.revisions.filter((item) => item.state === 'complete').length, 5)
  assert.deepEqual(inventory.revisions.filter((item) => item.state === 'incomplete'), [{ revision: emptyAttempt, state: 'incomplete', entries: [] }])
  const expected = { mediaId: a.id, foreignId: foreign.id, versionA, revisions, versions, snapshot, emptyAttempt, inventory,
    mediaFiles: await snapshotFiles(mediaDirectory) }
  await verify(fixture, owner, expected, mediaDirectory)
  return expected
}

const verify = async (fixture, owner, expected, mediaDirectory) => {
  const payload = fixture.payload
  const published = await payload.findByID({ collection: 'media', id: expected.mediaId, user: owner, overrideAccess: false, draft: false, depth: 0 })
  const draft = await payload.findByID({ collection: 'media', id: expected.mediaId, user: owner, overrideAccess: false, draft: true, depth: 0 })
  const publishedReceipt = receipt({ ...expected.revisions.B, storageRevision: expected.revisions.B.revision, _status: 'published' })
  const draftReceipt = receipt({ ...expected.revisions.C, storageRevision: expected.revisions.C.revision, _status: 'draft' })
  assert.deepEqual(receipt(published), publishedReceipt, 'Published B recovered')
  assert.deepEqual(receipt(draft), draftReceipt, 'Latest draft C recovered')
  assert.deepEqual(await versionsFor(fixture, owner, expected.mediaId), expected.versions, 'All version IDs and immutable references recovered')
  const snapshot = await payload.findByID({ collection: 'preview-snapshots', id: expected.snapshot.id, user: owner, overrideAccess: false, depth: 0 })
  assert.deepEqual(snapshot.manifest, expected.snapshot.manifest, 'Frozen preview manifest recovered exactly')
  assert.equal(snapshot.manifestHash, expected.snapshot.hash)
  assert.equal(snapshot.manifest.mediaReferences[0].storageRevision, expected.revisions.A.revision)
  const audits = await payload.find({ collection: 'audit-events', user: owner, overrideAccess: false, depth: 0, limit: 100 })
  assert.deepEqual(audits.docs.map(({ id }) => id), expected.snapshot.auditIds)
  const page = await payload.findByID({ collection: 'pages', id: expected.snapshot.pageId, user: owner, overrideAccess: false, draft: true, depth: 0 })
  assert.equal(page.brandProfile, expected.snapshot.brandId)
  assert.equal(page.layout[0].image, expected.mediaId)
  assert.deepEqual(await snapshotRevisionInventory(mediaDirectory), expected.inventory)
  assert.deepEqual(JSON.parse(await readFile(path.join(mediaDirectory, 'revision-inventory.json'), 'utf8')), expected.inventory)
  assert.deepEqual(await snapshotFiles(mediaDirectory), expected.mediaFiles, 'Every retained file hash/length recovered')
  for (const [label, revision] of Object.entries(expected.revisions)) {
    assert.deepEqual(await revisionEvidence(fixture, { ...revision, storageRevision: revision.revision, _status: revision.status }, label), revision)
  }
  await assertAuthorization(fixture, expected)
  assert.deepEqual(await readdir(fixture.staticDir), [], 'Native legacy storage stays empty')
}

const restore = async (fixture, owner, expected, mediaDirectory) => {
  await verify(fixture, owner, expected, mediaDirectory)
  const response = await fixture.request(`/api/media/versions/${expected.versionA}`, {
    method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' },
  })
  assert.equal(response.status, 200, 'Authenticated native version restore')
  const restored = await response.json()
  assert.equal(restored.storageRevision, expected.revisions.A.revision)
  assert.equal(restored._status, 'published')
  assert.deepEqual([restored.width, restored.height], [1920, 1200])
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.A, true, 200)
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.A, false, 200)
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.B, false, 404)
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.C, false, 404)
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.C, true, 200)
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.orphan, true, 404)
  await assertHTTPFiles(fixture, expected.mediaId, expected.revisions.foreign, true, 404)
  // A new binary edit proves independent writes, not just a metadata read.
  const edit = await upload(fixture, 'C', expected.mediaId, 'draft')
  assert(!Object.values(expected.revisions).some((revision) => revision.revision === edit.storageRevision))
  assert.equal(edit.alt, 'Recovery C')
  const current = await fixture.payload.findByID({ collection: 'media', id: expected.mediaId, user: owner, overrideAccess: false, draft: true })
  assert.equal(current.storageRevision, edit.storageRevision)
  // The frozen capture survives an edit to the recovered instance too.
  const frozen = await fixture.payload.findByID({ collection: 'preview-snapshots', id: expected.snapshot.id, user: owner, overrideAccess: false })
  assert.deepEqual(frozen.manifest, expected.snapshot.manifest)
  return { restoredVersionCount: expected.versions.length, restoredMediaFileCount: expected.mediaFiles.length,
    revisionsRecovered: expected.inventory.revisions.length, authenticatedHistoricalFiles: expected.revisions.A.files.length }
}

process.once('message', async (input) => {
  let fixture
  try {
    assert(['seed', 'restore', 'verify'].includes(input.mode))
    progress(`${input.mode}:opening-reviewed-http-fixture`)
    if (!input.postgres) await mkdir(input.databaseDirectory, { recursive: true })
    let failAfterWrite = false
    fixture = await startMediaHTTPFixture({
      root: input.mediaDirectory, revisionRoot: path.join(input.mediaDirectory, 'revisions'), staticDir: path.join(input.mediaDirectory, 'unused-native-media'),
      credentials: input.credentials, secret: input.payloadSecret, seed: input.mode === 'seed',
      database: input.postgres ? { engine: 'postgres', pool: input.postgres } : { engine: 'sqlite', filename: path.join(input.databaseDirectory, 'owner.db') },
      collections,
      decorateMedia: (media) => ({ ...media, hooks: { ...media.hooks, afterChange: [...(media.hooks?.afterChange ?? []), ({ doc }) => {
        if (failAfterWrite) throw new Error('Synthetic database failure after revision write')
        return doc
      }] } }),
    })
    const owner = (await fixture.payload.auth({ headers: new Headers({ Cookie: fixture.cookie }) })).user
    assert.equal(owner?.role, 'owner', 'Real HTTP login authenticates an owner')
    const result = input.mode === 'seed'
      ? await seed(fixture, owner, (value) => { failAfterWrite = value }, input.mediaDirectory)
      : input.mode === 'restore' ? await restore(fixture, owner, input.expected, input.mediaDirectory)
        : await verify(fixture, owner, input.expected, input.mediaDirectory).then(() => ({ sourceLogicalStateUnchanged: true }))
    progress(`${input.mode}:closing-http-and-payload`)
    await fixture.close()
    fixture = undefined
    await new Promise((resolve, reject) => process.send({ ok: true, result }, (error) => error ? reject(error) : resolve()))
  } catch (error) {
    await fixture?.close()
    await new Promise((resolve) => process.send({ ok: false, error: error instanceof Error ? error.message : 'Unknown versioned recovery failure' }, resolve))
    process.exitCode = 1
  } finally {
    process.disconnect?.()
    // Same lifecycle as the legacy worker: Payload destroy does not end its PG
    // pool. The existing parent runner waits for actual close and zero sessions.
    if (input.postgres) process.exit(process.exitCode ?? 0)
  }
})
process.send?.({ ready: true })
