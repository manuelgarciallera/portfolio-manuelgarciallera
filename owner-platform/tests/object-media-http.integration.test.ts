import { createServer } from 'node:http'
import { readdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createObjectRevisionStore } from '../src/media/object-revision-store'
import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'

// This small provider fixture exercises real Payload REST + S3 SDK end to end.
// The separate transport suite supplies timeouts and ambiguous-response faults.
const objects = new Map<string, Buffer>()
let failWrites = false
const server = createServer(async (req, res) => {
  const url = new URL(req.url!, 'http://127.0.0.1')
  const key = decodeURIComponent(url.pathname.replace(/^\/test-bucket\/?/, ''))
  if (url.searchParams.has('list-type')) {
    const keys = [...objects.keys()].filter((entry) => entry.startsWith(url.searchParams.get('prefix')!))
    res.setHeader('Content-Type', 'application/xml')
    res.end(`<ListBucketResult><IsTruncated>false</IsTruncated>${keys.map((entry) => `<Contents><Key>${entry}</Key></Contents>`).join('')}</ListBucketResult>`)
  } else if (req.method === 'PUT') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(Buffer.from(chunk))
    if (failWrites || req.headers['if-none-match'] !== '*' || objects.has(key)) {
      res.writeHead(failWrites ? 503 : 412); res.end(); return
    }
    objects.set(key, Buffer.concat(chunks)); res.end()
  } else if (req.method === 'GET' && objects.has(key)) {
    const bytes = objects.get(key)!
    res.setHeader('Content-Length', bytes.length); res.end(bytes)
  } else { res.writeHead(404); res.end() }
})
let client: S3Client
let storage: ReturnType<typeof createObjectRevisionStore>
let fixture: MediaHTTPFixture

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing provider fixture port')
  client = new S3Client({ endpoint: `http://127.0.0.1:${address.port}`, region: 'auto', forcePathStyle: true, maxAttempts: 1,
    credentials: { accessKeyId: 'synthetic-key', secretAccessKey: 'synthetic-secret' },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
  storage = createObjectRevisionStore({ client, bucket: 'test-bucket', prefix: 'cms-media' })
  fixture = await startMediaHTTPFixture(undefined, storage)
}, 60_000)

afterAll(async () => {
  try { await fixture?.close() } finally {
    client?.destroy()
    server.closeAllConnections()
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
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
  failWrites = true
  try {
    expect((await upload()).status).toBeGreaterThanOrEqual(400)
    expect((await fixture.payload.count({ collection: 'media', overrideAccess: true })).totalDocs).toBe(before.totalDocs)
  } finally { failWrites = false }
})
