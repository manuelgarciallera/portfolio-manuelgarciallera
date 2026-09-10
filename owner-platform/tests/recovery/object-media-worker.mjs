import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { createObjectRevisionStore } from '../../src/media/object-revision-store.ts'
import { startMediaHTTPFixture } from '../media/http-fixture.ts'
import { PreviewSnapshots } from '../../src/collections/PreviewSnapshots.ts'
import { collectPayloadRevisionReferences } from '../../src/media/legacy-media-inventory-service.ts'
import { createLocalReq } from 'payload'

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
const logicalMedia = async (fixture, owner, id) => {
  // JSON IPC drops undefined keys; use explicit nulls for optional version fields.
  const pick = (doc) => ({ id: doc.id ?? null, revision: doc.storageRevision ?? null, alt: doc.alt ?? null,
    status: doc._status ?? null, width: doc.width ?? null, height: doc.height ?? null })
  const current = await fixture.payload.findByID({ collection: 'media', id, user: owner, overrideAccess: false, depth: 0 })
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

process.once('message', async (input) => {
  let fixture, client
  try {
    assert(['seed', 'restore', 'verify'].includes(input.mode))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    client = new S3Client({ endpoint: `http://127.0.0.1:${server.address().port}`, region: 'auto', forcePathStyle: true, maxAttempts: 1,
      credentials: { accessKeyId: 'synthetic', secretAccessKey: 'synthetic' },
      requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
    const store = createObjectRevisionStore({ client, bucket: 'test-bucket', prefix: 'recovery-media' })
    assert.equal(objects.size, 0, 'Each child starts with an empty provider')
    if (input.mode !== 'seed') {
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
      collections: [PreviewSnapshots],
      database: input.postgres ? { engine: 'postgres', pool: input.postgres }
        : { engine: 'sqlite', filename: path.join(input.databaseDirectory, 'owner.db') },
    }, store)
    const owner = (await fixture.payload.auth({ headers: new Headers({ Cookie: fixture.cookie }) })).user
    assert.equal(owner?.role, 'owner', 'Restored owner can log in through real HTTP')
    let result
    if (input.mode === 'seed') {
      const first = await upload(fixture, '#ff0000')
      const versions = await fixture.payload.findVersions({ collection: 'media', user: owner, overrideAccess: false,
        where: { parent: { equals: first.id } }, limit: 100, depth: 0 })
      assert.equal(versions.docs.length, versions.totalDocs)
      const second = await upload(fixture, '#0000ff', first.id)
      const references = await collectPayloadRevisionReferences({ payload: fixture.payload, req: await createLocalReq({ user: owner }, fixture.payload) })
      assert.deepEqual(references.map(({ revision }) => revision).sort(), [first.storageRevision, second.storageRevision].sort())
      const revisions = []
      // Export IDs discovered from the database, not the upload receipt list.
      for (const group of references) {
        const doc = group.revision === first.storageRevision ? first : second
        const color = group.revision === first.storageRevision ? '#ff0000' : '#0000ff'
        const exported = await store.exportRevision(group.revision)
        assert.equal(exported.files.length, 4, 'Original and three derivatives')
        assert.deepEqual(exported.files.find((file) => file.name === doc.filename).bytes, await image(color))
        const directory = path.join(input.mediaDirectory, doc.storageRevision)
        await mkdir(directory)
        for (const [index, file] of exported.files.entries()) await writeFile(path.join(directory, `${index}.bin`), file.bytes, { flag: 'wx', mode: 0o600 })
        await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(exported.manifest), { flag: 'wx', mode: 0o600 })
        revisions.push({ id: doc.storageRevision, files: exported.files.map(({ name, bytes }) => ({ name, sha256: sha(bytes) })) })
      }
      revisions.sort((left, right) => left.id === first.storageRevision ? -1 : right.id === first.storageRevision ? 1 : 0)
      await verifyFiles(fixture, first.id, revisions[0], 404)
      await verifyFiles(fixture, first.id, revisions[1], 200)
      result = { mediaId: first.id, versionId: versions.docs[0].id, revisions, references, pid: process.pid, logical: await logicalMedia(fixture, owner, first.id) }
    } else {
      const expected = input.expected
      assert.deepEqual(await collectPayloadRevisionReferences({ payload: fixture.payload, req: await createLocalReq({ user: owner }, fixture.payload) }), expected.references, 'Recovered reference inventory')
      await verifyFiles(fixture, expected.mediaId, expected.revisions[0], 404)
      await verifyFiles(fixture, expected.mediaId, expected.revisions[1], 200)
      assert.deepEqual(await logicalMedia(fixture, owner, expected.mediaId), expected.logical, 'Current media and complete version receipts survive unchanged')
      if (input.mode === 'verify') {
        result = { sourceLogicalStateUnchanged: true }
      } else {
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
      result = { pid: process.pid, recoveredRevisions: 2, recoveredFiles: 8, login: true, history: true, independentEdit: true }
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
