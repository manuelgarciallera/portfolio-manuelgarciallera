import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { startMediaHTTPFixture } from './http-fixture.ts'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const seedSet = async (fixture, owner, label) => {
  const ordinary = label === 'ordinary'
  const width = ordinary ? 2400 : 6000
  const height = ordinary ? 1350 : 3200
  const generated = ordinary
    ? await sharp({ create: { width, height, channels: 3, background: '#50789a' } }).jpeg({ quality: 85 }).toBuffer()
    : await sharp(randomBytes(width * height * 3), { raw: { width, height, channels: 3 } }).png().toBuffer()
  const generatedSha256 = sha256(generated)
  const filename = ordinary ? 'ordinary.jpg' : 'near-limit.png'
  const doc = await fixture.payload.create({ collection: 'media', user: owner, overrideAccess: false,
    data: { alt: `Synthetic resource measurement ${label}`, _status: 'published' },
    file: { data: generated, name: filename, mimetype: ordinary ? 'image/jpeg' : 'image/png', size: generated.length } })
  assert.equal(doc._status, 'published')
  assert.equal(doc.width, width)
  assert.equal(doc.height, height)
  const entries = [{ variant: 'original', ...doc }, ...Object.entries(doc.sizes).map(([variant, entry]) => ({ variant, ...entry }))]
  assert.equal(entries.length, 4)
  const files = []
  // Read and hash actual physical bytes independently of the revision manifest.
  for (const entry of entries) {
    const relativeFile = `revisions/${doc.storageRevision}/${entry.filename}`
    const bytes = await readFile(path.join(fixture.revisionRoot, doc.storageRevision, entry.filename))
    const metadata = await sharp(bytes).metadata()
    assert.equal(bytes.length, entry.filesize)
    assert.deepEqual([metadata.width, metadata.height], [entry.width, entry.height])
    const digest = sha256(bytes)
    if (entry.variant === 'original') assert.equal(digest, generatedSha256)
    files.push({ variant: entry.variant, filename: entry.filename, relativeFile,
      pathname: `/api/media/revision/${doc.id}/${doc.storageRevision}/${encodeURIComponent(entry.filename)}`,
      width: entry.width, height: entry.height, bytes: bytes.length, sha256: digest })
  }
  const aggregateBytes = files.reduce((total, file) => total + file.bytes, 0)
  return { label, id: doc.id, revision: doc.storageRevision, width, height,
    recipe: ordinary ? 'Sharp constant RGB #50789a, JPEG quality 85' : 'crypto.randomBytes RGB, Sharp default PNG; unseeded high entropy',
    aggregateBytes, capBytes: 67_108_864, capFraction: aggregateBytes / 67_108_864, files }
}

process.once('message', async (input) => {
  let fixture
  try {
    assert.equal(input.mode, 'resource-seed')
    fixture = await startMediaHTTPFixture({ root: input.root, revisionRoot: path.join(input.root, 'revisions'),
      staticDir: path.join(input.root, 'unused-native-media'), credentials: input.credentials,
      secret: input.payloadSecret, seed: true, database: { engine: 'sqlite', filename: path.join(input.root, 'owner.db') } })
    const owner = (await fixture.payload.auth({ headers: new Headers({ Cookie: fixture.cookie }) })).user
    assert.equal(owner?.role, 'owner', 'Real login authenticates Local API owner')
    const datasets = []
    for (const label of ['ordinary', 'near-limit']) datasets.push(await seedSet(fixture, owner, label))
    assert.deepEqual(await readdir(fixture.staticDir), [])
    const sqlite = await fixture.payload.db.client.execute('select sqlite_version() as version')
    const result = { datasets, sqliteVersion: sqlite.rows[0].version,
      nearLimitInRange: datasets[1].capFraction >= 0.9 && datasets[1].capFraction <= 1 }
    await fixture.close()
    fixture = undefined
    process.send({ ok: true, result })
  } catch (error) {
    try { await fixture?.close() } catch (closeError) { console.error(closeError) }
    process.exitCode = 1
    process.send({ ok: false, error: error.message })
  } finally { process.disconnect() }
})
process.send({ ready: true })
