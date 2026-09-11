import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { createObjectRevisionStore } from '../../src/media/object-revision-store.ts'
import { presentPreviewAsset } from '../../src/media/placement-preview.ts'
import { startMediaHTTPFixture } from '../media/http-fixture.ts'
import { previewRecoveryCollections, captureRecoveryPreview, verifyRecoveryPreview } from './preview-recovery-fixture.mjs'
import { collectPayloadRevisionReferences } from '../../src/media/legacy-media-inventory-service.ts'
import { createLocalReq } from 'payload'
import { verifySnapshotInBrowser } from './snapshot-browser.mjs'
import { captureFullOwnerPreview, prepareFullOwnerRecovery, readFullOwnerWorkflow, executeRecoveredOwnerWorkflow } from './full-owner-recovery-fixture.mjs'
import { captureRecoveryMigrationCandidate, restoreRecoveryMigration } from './migration-copy-recovery-fixture.mjs'
import { seedRecoveryArticle, verifyRecoveryArticle } from './article-recovery-fixture.mjs'

// A provider owned by this child only: no persistence and no parent-held Map.
// Exiting the seed process destroys the original provider and all its objects.
const objects = new Map()
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1')
    const key = decodeURIComponent(url.pathname.replace(/^\/test-bucket\/?/, ''))
    if (req.method === 'GET' && url.searchParams.has('list-type')) {
      const keys = [...objects.keys()].filter((entry) => entry.startsWith(url.searchParams.get('prefix')))
      res.setHeader('Content-Type', 'application/xml')
      res.end(`<ListBucketResult><IsTruncated>false</IsTruncated>${keys.map((entry) => `<Contents><Key>${entry}</Key></Contents>`).join('')}</ListBucketResult>`)
    } else if (req.method === 'PUT') {
      const chunks = []
      for await (const chunk of req) chunks.push(Buffer.from(chunk))
      if (req.headers['if-none-match'] !== '*' || objects.has(key)) { res.writeHead(412); res.end(); return }
      objects.set(key, Buffer.concat(chunks)); res.end()
    } else if (req.method === 'GET' && objects.has(key)) {
      const bytes = objects.get(key)
      res.setHeader('Content-Length', bytes.length); res.end(bytes)
    } else { res.writeHead(404); res.end() }
  } catch { res.writeHead(500); res.end() }
})
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
// Compare the pre-backup API receipts to the independently reopened database.
// This catches dropped page history or changed brand/layout even when images and
// the frozen preview still render. Only JSON-visible data crosses worker IPC.
const logicalEditorial = async (fixture, owner, snapshot) => {
  const options = { user: owner, overrideAccess: false, depth: 0 }
  const page = await fixture.payload.findByID({ ...options, collection: 'pages', id: snapshot.pageId, draft: true })
  const brand = await fixture.payload.findByID({ ...options, collection: 'brand-profiles', id: snapshot.brandId })
  const versions = await fixture.payload.findVersions({ ...options, collection: 'pages',
    where: { parent: { equals: snapshot.pageId } }, limit: 100, sort: 'id' })
  assert(versions.totalDocs >= 3, 'The seeded page retains its intermediate editorial edits')
  assert.equal(versions.docs.length, versions.totalDocs, 'The recovery receipt covers every synthetic page version')
  return JSON.parse(JSON.stringify({ page, brand, versions: versions.docs }))
}
const logicalMedia = async (fixture, owner, id) => {
  // JSON IPC drops undefined keys; use explicit nulls for optional version fields.
  const pick = (doc) => ({ id: doc.id ?? null, revision: doc.storageRevision ?? null, alt: doc.alt ?? null,
    status: doc._status ?? null, width: doc.width ?? null, height: doc.height ?? null })
  const current = await fixture.payload.findByID({ collection: 'media', id, user: owner, overrideAccess: false, depth: 0 })
  const previewAsset = presentPreviewAsset(current, id)
  const previewResponse = await fixture.request(previewAsset.url)
  assert.equal(previewResponse.status, 200, 'The visual preview accepts the real recovered media URL')
  assert.equal(previewAsset.width, current.width)
  assert.equal(previewAsset.height, current.height)
  const versions = await fixture.payload.findVersions({ collection: 'media', user: owner, overrideAccess: false,
    where: { parent: { equals: id } }, limit: 100, depth: 0 })
  assert.equal(versions.docs.length, versions.totalDocs, 'Complete synthetic history')
  return { current: pick(current), versions: versions.docs.map((doc) => ({ id: doc.id, parent: doc.parent, version: pick(doc.version) })).sort((a, b) => Number(a.id) - Number(b.id)) }
}
const image = (color) => sharp({ create: { width: 1200, height: 800, channels: 3, background: color } }).png().toBuffer()
const upload = async (fixture, color, id) => {
  const body = new FormData()
  body.set('_payload', JSON.stringify({ alt: color, _status: 'published' }))
  body.set('file', new File([await image(color)], 'recovery.png', { type: 'image/png' }))
  const response = await fixture.request(`/api/media${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body })
  assert.equal(response.status, id ? 200 : 201)
  return (await response.json()).doc
}

const verifyFiles = async (fixture, id, revision, publicStatus) => {
  for (const file of revision.files) {
    const url = `/api/media/revision/${id}/${revision.id}/${encodeURIComponent(file.name)}`
    for (const authenticated of [true, false]) {
      const response = await fixture.request(url, {}, authenticated)
      assert.equal(response.status, authenticated ? 200 : publicStatus, 'Recovered HTTP authorization and availability')
      if (response.status === 200) assert.equal(sha(Buffer.from(await response.arrayBuffer())), file.sha256, 'Recovered HTTP bytes')
    }
  }
}

const verifySnapshotOnly = async (fixture, store, mediaId, revision, snapshot) => {
  const original = snapshot.manifest.mediaReferences.find(ref => ref.id === String(mediaId))
  assert(original)
  const capturedURL = `/api/media/snapshot/${snapshot.id}/${mediaId}`
  const capturedResponse = await fixture.request(capturedURL)
  assert.equal(capturedResponse.status, 200, 'Owner can read snapshot-only original through private HTTP')
  assert.equal(capturedResponse.headers.get('cache-control'), 'private, no-store')
  assert.equal(capturedResponse.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(capturedResponse.headers.get('content-security-policy'), "default-src 'none'; sandbox")
  assert.equal(capturedResponse.headers.get('content-type'), 'image/png')
  assert.equal(sha(Buffer.from(await capturedResponse.arrayBuffer())), revision.files.find(file => file.name === original.filename).sha256)
  assert.equal((await fixture.request(capturedURL, {}, false)).status, 404)
  assert.equal((await fixture.request(`/api/media/snapshot/${snapshot.id}/999999`)).status, 404)
  assert.equal((await fixture.request(`/api/media/snapshot/999999/${mediaId}`)).status, 404)
  const files = await store.read(revision.id)
  assert.equal(files.length, revision.files.length)
  for (const expected of revision.files) {
    const file = files.find(({ name }) => name === expected.name)
    assert(file)
    assert.equal(sha(file.bytes), expected.sha256, 'Snapshot-only bytes survive internally')
    const url = `/api/media/revision/${mediaId}/${revision.id}/${encodeURIComponent(file.name)}`
    for (const authenticated of [true, false]) {
      assert.equal((await fixture.request(url, {}, authenticated)).status, 404, 'Backup retention must not grant a historical URL after version removal')
    }
  }
}

process.once('message', async (input) => {
  let fixture, client
  try {
    assert(['seed', 'restore', 'verify'].includes(input.mode))
    // The full config validates its secret when imported. The child receives
    // this per-run synthetic value via IPC; ambient credentials stay cleared.
    if (input.fullOwner) process.env.PAYLOAD_SECRET = input.payloadSecret
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    client = new S3Client({ endpoint: `http://127.0.0.1:${server.address().port}`, region: 'auto', forcePathStyle: true, maxAttempts: 1,
      credentials: { accessKeyId: 'synthetic', secretAccessKey: 'synthetic' },
      requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
    const store = createObjectRevisionStore({ client, bucket: 'test-bucket', prefix: 'recovery-media' })
    assert.equal(objects.size, 0, 'Each child starts with an empty provider')
    if (input.mode !== 'seed' && !input.fullOwner) {
      for (const revision of input.expected.revisions) {
        assert(/^[0-9a-f-]{36}$/.test(revision.id), 'Synthetic revision must be a safe directory name')
        const directory = path.join(input.mediaDirectory, revision.id)
        const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'))
        const files = await Promise.all(manifest.files.map(async (file, index) => ({
          name: file.name, bytes: await readFile(path.join(directory, `${index}.bin`)),
        })))
        await store.restore(revision.id, manifest, files)
      }
    }
    if (!input.postgres) await mkdir(input.databaseDirectory, { recursive: true })
    fixture = await startMediaHTTPFixture({ root: input.mediaDirectory,
      revisionRoot: path.join(input.mediaDirectory, 'unused-revisions'), staticDir: path.join(input.mediaDirectory, 'unused-native'),
      credentials: input.credentials, secret: input.payloadSecret, seed: input.mode === 'seed',
      ...(input.fullOwner ? { fullOwnerConfig: true, nativeObjectMigrations: true,
        mediaEnvironment: { NODE_ENV: 'test', OWNER_MEDIA_MODE: 'objects', OWNER_MEDIA_ENDPOINT: `http://127.0.0.1:${server.address().port}`,
          OWNER_MEDIA_REGION: 'auto', OWNER_MEDIA_BUCKET: 'test-bucket', OWNER_MEDIA_PREFIX: 'recovery-media',
          OWNER_MEDIA_ACCESS_KEY_ID: 'synthetic', OWNER_MEDIA_SECRET_ACCESS_KEY: 'synthetic' } }
        : { collections: previewRecoveryCollections }),
      database: input.postgres ? { engine: 'postgres', pool: input.postgres }
        : { engine: 'sqlite', filename: path.join(input.databaseDirectory, 'owner.db') },
    }, input.fullOwner ? undefined : store)
    if (input.fullOwner) assert(fixture.payload.collections.releases && fixture.payload.collections['restore-plans'], 'Full owner recovery must use the real release and restore collections')
    const owner = (await fixture.payload.auth({ headers: new Headers({ Cookie: fixture.cookie }) })).user
    assert.equal(owner?.role, 'owner', 'Restored owner can log in through real HTTP')
    const migrationResult = input.fullOwner && input.mode !== 'seed'
      ? await restoreRecoveryMigration(fixture, owner, store, input) : {}
    let result
    if (input.mode === 'seed') {
      const captured = await upload(fixture, '#ffff00')
      const snapshot = await (input.fullOwner ? captureFullOwnerPreview : captureRecoveryPreview)(fixture, owner, captured)
      for (const title of ['Intermediate draft before backup', 'Frozen object recovery']) {
        await fixture.payload.update({ collection: 'pages', id: snapshot.pageId, user: owner,
          overrideAccess: false, draft: true, data: { title } })
      }
      const first = await upload(fixture, '#ff0000', captured.id)
      const versions = await fixture.payload.findVersions({ collection: 'media', user: owner, overrideAccess: false,
        where: { parent: { equals: first.id } }, limit: 100, depth: 0 })
      assert.equal(versions.docs.length, versions.totalDocs)
      const second = await upload(fixture, '#0000ff', first.id)
      // Model retention on this isolated fixture only. Resolve exact rows first;
      // never delete objects or a live application's versions.
      const capturedVersions = versions.docs.filter(({ version }) => version.storageRevision === captured.storageRevision).map(({ id }) => id)
      assert(capturedVersions.length > 0)
      await fixture.payload.db.deleteVersions({ collection: 'media', where: { and: [
        { parent: { equals: captured.id } }, { id: { in: capturedVersions } },
      ] } })
      await verifyRecoveryPreview(fixture, owner, snapshot)
      const workflow = input.fullOwner ? await prepareFullOwnerRecovery(fixture, owner, snapshot) : undefined
      const article = input.fullOwner ? await seedRecoveryArticle(fixture, owner, second.id) : undefined
      const references = await collectPayloadRevisionReferences({ payload: fixture.payload, req: await createLocalReq({ user: owner }, fixture.payload) })
      assert.deepEqual(references.map(({ revision }) => revision).sort(), [first.storageRevision, second.storageRevision, captured.storageRevision].sort())
      assert(references.find(({ revision }) => revision === captured.storageRevision).references.some(({ kind }) => kind === 'snapshot'), 'Historical image must be retained by its real frozen preview')
      assert(references.find(({ revision }) => revision === captured.storageRevision).references.every(({ kind }) => kind === 'snapshot'), 'Snapshot-only retention must not rely on a surviving media version')
      const revisions = []
      // Export IDs discovered from the database, not the upload receipt list.
      for (const group of references) {
        const doc = [first, second, captured].find(({ storageRevision }) => storageRevision === group.revision)
        assert(doc)
        const color = group.revision === first.storageRevision ? '#ff0000' : group.revision === second.storageRevision ? '#0000ff' : '#ffff00'
        const exported = await store.exportRevision(group.revision)
        assert.equal(exported.files.length, 4, 'Original and three derivatives')
        assert.deepEqual(exported.files.find((file) => file.name === doc.filename).bytes, await image(color))
        const directory = path.join(input.mediaDirectory, doc.storageRevision)
        await mkdir(directory)
        for (const [index, file] of exported.files.entries()) await writeFile(path.join(directory, `${index}.bin`), file.bytes, { flag: 'wx', mode: 0o600 })
        await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(exported.manifest), { flag: 'wx', mode: 0o600 })
        revisions.push({ id: doc.storageRevision, files: exported.files.map(({ name, bytes }) => ({ name, sha256: sha(bytes) })) })
      }
      const order = [first.storageRevision, second.storageRevision, captured.storageRevision]
      revisions.sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id))
      await verifyFiles(fixture, first.id, revisions[0], 404)
      await verifyFiles(fixture, first.id, revisions[1], 200)
      await verifySnapshotOnly(fixture, store, first.id, revisions[2], snapshot)
      const migrationCandidate = input.fullOwner ? await captureRecoveryMigrationCandidate(fixture, owner, input.mediaDirectory) : undefined
      result = { mediaId: first.id, versionId: versions.docs.find(({ version }) => version.storageRevision === first.storageRevision).id,
        revisions, references, snapshot, pid: process.pid, logical: await logicalMedia(fixture, owner, first.id),
        editorial: await logicalEditorial(fixture, owner, snapshot), migrationCandidate, article,
        ...(workflow ? { workflow, workflowReceipt: await readFullOwnerWorkflow(fixture, owner, snapshot, workflow) } : {}) }
    } else {
      const expected = input.expected
      const articleResult = input.fullOwner ? await verifyRecoveryArticle(fixture, owner, expected.article, input.mode === 'restore') : {}
      assert.deepEqual(await logicalEditorial(fixture, owner, expected.snapshot), expected.editorial,
        'Recovered draft, full page history and brand must match their pre-backup receipts')
      await verifyRecoveryPreview(fixture, owner, expected.snapshot)
      assert.deepEqual(await collectPayloadRevisionReferences({ payload: fixture.payload, req: await createLocalReq({ user: owner }, fixture.payload) }), expected.references, 'Recovered reference inventory')
      await verifyFiles(fixture, expected.mediaId, expected.revisions[0], 404)
      await verifyFiles(fixture, expected.mediaId, expected.revisions[1], 200)
      await verifySnapshotOnly(fixture, store, expected.mediaId, expected.revisions[2], expected.snapshot)
      assert.deepEqual(await logicalMedia(fixture, owner, expected.mediaId), expected.logical, 'Current media and complete version receipts survive unchanged')
      if (input.fullOwner) assert.deepEqual(await readFullOwnerWorkflow(fixture, owner, expected.snapshot, expected.workflow), expected.workflowReceipt, 'Releases, restore plans, draft snapshots, audits and migrations survive unchanged')
      if (input.mode === 'verify') {
        result = { sourceLogicalStateUnchanged: true, ...migrationResult, ...articleResult }
      } else {
      const workflowResult = input.fullOwner ? await executeRecoveredOwnerWorkflow(fixture, owner, expected.snapshot, expected.workflow) : {}
      const restored = await fixture.request(`/api/media/versions/${expected.versionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      assert.equal(restored.status, 200)
      assert.equal((await restored.json()).storageRevision, expected.revisions[0].id)
      await verifyFiles(fixture, expected.mediaId, expected.revisions[0], 200)
      await verifyFiles(fixture, expected.mediaId, expected.revisions[1], 404)
      const edited = await upload(fixture, '#00ff00', expected.mediaId)
      assert(!expected.revisions.some(({ id }) => id === edited.storageRevision))
      const downloaded = await fixture.request(`/api/media/revision/${edited.id}/${edited.storageRevision}/${encodeURIComponent(edited.filename)}`, {}, false)
      assert.equal(downloaded.status, 200)
      assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), await image('#00ff00'), 'Recovered instance serves the independently generated edited image')
      await verifyFiles(fixture, expected.mediaId, expected.revisions[0], 404)
      await verifyFiles(fixture, expected.mediaId, expected.revisions[1], 404)
      await verifyRecoveryPreview(fixture, owner, expected.snapshot)
      await verifySnapshotOnly(fixture, store, expected.mediaId, expected.revisions[2], expected.snapshot)
      await verifySnapshotInBrowser(fixture, owner, expected.snapshot, input.credentials)
      result = { pid: process.pid, recoveredRevisions: 3, recoveredFiles: 12, login: true, history: true, independentEdit: true, frozenPreview: true, snapshotOnlyRetention: true, snapshotBrowser: true,
        pageVersionsRestored: expected.editorial.versions.length, editorialStateUnchanged: true, ...workflowResult, ...migrationResult, ...articleResult }
      }
    }
    assert.deepEqual(await readdir(fixture.staticDir), [], 'No native filesystem media fallback')
    await fixture.close(); fixture = undefined
    client.destroy(); client = undefined
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await new Promise((resolve) => process.send({ ok: true, result }, resolve))
  } catch (error) {
    await fixture?.close()
    client?.destroy()
    server.closeAllConnections()
    if (server.listening) await new Promise((resolve) => server.close(resolve))
    await new Promise((resolve) => process.send({ ok: false, error: error.message }, resolve))
    process.exitCode = 1
  } finally {
    process.disconnect?.()
    // The parent waits for process close and separately verifies zero PG sessions.
    // Payload destroy alone does not terminate its PostgreSQL pool.
    if (input.postgres) process.exit(process.exitCode ?? 0)
  }
})
process.send?.({ ready: true })
