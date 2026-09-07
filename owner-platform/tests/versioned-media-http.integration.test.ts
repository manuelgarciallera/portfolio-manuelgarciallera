import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { readMediaRevision } from '../src/media/revision-store'
import { startHTTPRequestRecorder, startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'

let fixture: MediaHTTPFixture

beforeAll(async () => {
  fixture = await startMediaHTTPFixture()
}, 60_000)

afterAll(async () => {
  await fixture?.close()
})

const image = async (background: string) => sharp({
  create: { width: 1200, height: 800, channels: 3, background },
}).png().toBuffer()

const revision = (doc: Record<string, unknown>) => doc.storageRevision as string
const upload = async (background = '#ff0000', status: 'draft' | 'published' = 'published') => {
  const bytes = await image(background)
  const body = new FormData()
  body.set('_payload', JSON.stringify({ alt: 'Native HTTP image', _status: status }))
  body.set('file', new File([bytes], `native-${randomUUID()}.png`, { type: 'image/png' }))
  const response = await fixture.request(`/api/media${status === 'draft' ? '?draft=true' : ''}`, { body, method: 'POST' })
  expect(response.status).toBe(201)
  return (await response.json()).doc as Record<string, unknown>
}

const cropPath = (doc: Record<string, unknown>) => {
  const query = new URLSearchParams({
    'uploadEdits[crop][height]': '50',
    'uploadEdits[crop][width]': '50',
    'uploadEdits[crop][x]': '25',
    'uploadEdits[crop][y]': '25',
    'uploadEdits[focalPoint][x]': '50',
    'uploadEdits[focalPoint][y]': '50',
    'uploadEdits[heightInPixels]': '400',
    'uploadEdits[widthInPixels]': '600',
  })
  return `/api/media/${doc.id}?${query}`
}
const crop = async (doc: Record<string, unknown>, authenticated = true, overrides: Record<string, unknown> = {}) =>
  fixture.request(cropPath(doc), {
    body: JSON.stringify({
      alt: doc.alt, filename: doc.filename, storageRevision: doc.storageRevision, url: doc.url, _status: doc._status, ...overrides,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  }, authenticated)

it('crops and restores immutable originals and derivatives through native REST endpoints', async () => {
  const original = await upload()
  const originalRevision = revision(original)
  const originalFiles = await readMediaRevision(fixture.revisionRoot, originalRevision)
  const versions = await fixture.payload.findVersions({
    collection: 'media', overrideAccess: true, where: { parent: { equals: original.id } }, sort: '-createdAt',
  })

  const response = await crop(original)
  expect(response.status).toBe(200)
  const cropped = (await response.json()).doc as Record<string, unknown>
  expect(revision(cropped)).not.toBe(originalRevision)
  expect(cropped).toMatchObject({ height: 400, width: 600 })
  expect(await readMediaRevision(fixture.revisionRoot, originalRevision)).toEqual(originalFiles)
  const historicalURL = `/api/media/revision/${original.id}/${originalRevision}/${encodeURIComponent(original.filename as string)}`
  const ownerHistory = await fixture.request(historicalURL)
  expect(ownerHistory.status).toBe(200)
  expect(Buffer.from(await ownerHistory.arrayBuffer())).toEqual(originalFiles.find((file) => file.name === original.filename)?.bytes)
  expect((await fixture.request(historicalURL, {}, false)).status).toBe(404)

  const restoreResponse = await fixture.request(`/api/media/versions/${versions.docs[0].id}`, {
    body: '{}', headers: { 'Content-Type': 'application/json' }, method: 'POST',
  })
  expect(restoreResponse.status).toBe(200)
  const restored = await restoreResponse.json() as Record<string, unknown>
  expect(revision(restored)).toBe(originalRevision)
  expect(restored).toMatchObject({ height: 800, width: 1200 })
  expect(await readMediaRevision(fixture.revisionRoot, originalRevision)).toEqual(originalFiles)
})

it('crops the latest draft image when the same native update publishes it', async () => {
  const published = await upload('#cc0000')
  const draftBody = new FormData()
  const draftBytes = await image('#0000cc')
  draftBody.set('_payload', JSON.stringify({ alt: 'Newer blue draft', _status: 'draft' }))
  draftBody.set('file', new File([draftBytes], `draft-${randomUUID()}.png`, { type: 'image/png' }))
  const draftResponse = await fixture.request(`/api/media/${published.id}?draft=true`, { body: draftBody, method: 'PATCH' })
  expect(draftResponse.status).toBe(200)
  const draft = (await draftResponse.json()).doc as Record<string, unknown>
  expect(revision(draft)).not.toBe(revision(published))

  const response = await crop(draft, true, { _status: 'published' })
  expect(response.status).toBe(200)
  const cropped = (await response.json()).doc as Record<string, unknown>
  expect(cropped._status).toBe('published')
  const files = await readMediaRevision(fixture.revisionRoot, revision(cropped))
  const croppedOriginal = files.find((file) => file.name === cropped.filename)
  if (!croppedOriginal) throw new Error('Missing cropped draft original')
  const decoded = sharp(croppedOriginal.bytes)
  expect(await decoded.metadata()).toMatchObject({ height: 400, width: 600 })
  expect([...(await decoded.raw().toBuffer()).subarray(0, 3)]).toEqual([0, 0, 204])
})

it('duplicates a revision-backed image through the authenticated native REST endpoint', async () => {
  const source = await upload()
  const sourceRevision = revision(source)
  const sourceFiles = await readMediaRevision(fixture.revisionRoot, sourceRevision)

  const response = await fixture.request(`/api/media/${source.id}/duplicate`, {
    body: JSON.stringify({ _status: 'draft' }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  expect(response.status).toBe(200)
  const duplicate = (await response.json()).doc as Record<string, unknown>
  expect(duplicate.id).not.toBe(source.id)
  expect(duplicate.storageRevision).not.toBe(sourceRevision)
  expect(await readMediaRevision(fixture.revisionRoot, duplicate.storageRevision as string)).toHaveLength(sourceFiles.length)
  expect(await readMediaRevision(fixture.revisionRoot, sourceRevision)).toEqual(sourceFiles)

  const edit = await fixture.request(`/api/media/${duplicate.id}?draft=true`, {
    body: JSON.stringify({ alt: 'Independently edited duplicate' }),
    headers: { 'Content-Type': 'application/json' }, method: 'PATCH',
  })
  expect(edit.status).toBe(200)
  expect((await edit.json()).doc).toMatchObject({ alt: 'Independently edited duplicate', id: duplicate.id })
  const unchangedSource = await fixture.payload.findByID({ collection: 'media', id: source.id as number, overrideAccess: true })
  expect(unchangedSource).toMatchObject({ alt: source.alt, storageRevision: sourceRevision })
})

it('delivers only authorized exact revisions and ignores ranges without advertising partial responses', async () => {
  const published = await upload('#00aa00')
  const publishedRevision = revision(published)
  const publishedFiles = await readMediaRevision(fixture.revisionRoot, publishedRevision)
  for (const file of publishedFiles) {
    const pathname = `/api/media/revision/${published.id}/${publishedRevision}/${encodeURIComponent(file.name)}`
    const response = await fixture.request(pathname, {}, false)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(Buffer.from(await response.arrayBuffer())).toEqual(file.bytes)

    const ranged = await fixture.request(pathname, { headers: { Range: 'bytes=0-7' } }, false)
    expect(ranged.status).toBe(200)
    expect(ranged.headers.get('accept-ranges')).toBeNull()
    expect(ranged.headers.get('content-range')).toBeNull()
    expect(Buffer.from(await ranged.arrayBuffer())).toEqual(file.bytes)
  }

  const draft = await upload('#0000aa', 'draft')
  expect((await fixture.request(draft.url as string, {}, false)).status).toBe(404)
  expect((await fixture.request(draft.url as string)).status).toBe(200)
  const foreign = `/api/media/revision/${published.id}/${revision(draft)}/${encodeURIComponent(draft.filename as string)}`
  expect((await fixture.request(foreign)).status).toBe(404)
  const rangedPrivate = await fixture.request(draft.url as string, { headers: { Range: 'bytes=0-7' } }, false)
  expect(rangedPrivate.status).toBe(404)
  expect(rangedPrivate.headers.get('content-range')).toBeNull()

  const trashed = await upload('#aaaa00')
  const trashResponse = await fixture.request(`/api/media/${trashed.id}`, {
    body: JSON.stringify({ deletedAt: new Date().toISOString() }),
    headers: { 'Content-Type': 'application/json' }, method: 'PATCH',
  })
  expect(trashResponse.status).toBe(200)
  expect((await fixture.request(trashed.url as string)).status).toBe(404)
  expect((await fixture.request(`/api/media/revision/${published.id}/bad/${published.filename}`)).status).toBe(404)
  expect((await fixture.request(`/api/media/revision/${published.id}/${publishedRevision}/..%2Fmanifest.json`)).status).toBe(404)

  const malformedRange = await fixture.request(published.url as string, { headers: { Range: 'not-a-range' } }, false)
  expect(malformedRange.status).toBe(200)
  expect(Buffer.from(await malformedRange.arrayBuffer())).toEqual(publishedFiles.find((file) => file.name === published.filename)?.bytes)
})

it('keeps the loopback transport exception exact and unauthenticated native mutations inert', async () => {
  const allowed = fixture.allowedNativeOrigin
  expect(allowed).toEqual({
    hostname: '127.0.0.1', pathname: '/api/media/revision/**', port: new URL(fixture.origin).port, protocol: 'http',
  })
  const { isURLAllowed } = await import('../node_modules/payload/dist/utilities/isURLAllowed.js')
  expect(isURLAllowed(`${fixture.origin}/api/media/revision/1/11111111-1111-4111-8111-111111111111/file.png`, [allowed])).toBe(true)
  expect(isURLAllowed(`${fixture.origin}/api/media/file/file.png`, [allowed])).toBe(false)
  expect(isURLAllowed(`http://localhost:${new URL(fixture.origin).port}/api/media/revision/x`, [allowed])).toBe(false)
  expect(isURLAllowed(`http://127.0.0.1:${Number(new URL(fixture.origin).port) + 1}/api/media/revision/x`, [allowed])).toBe(false)
  expect(isURLAllowed(fixture.origin.replace('http:', 'https:') + '/api/media/revision/x', [allowed])).toBe(false)
  await expect(fixture.request('http://127.0.0.1:1/api/media/revision/x')).rejects.toThrow(/exact loopback origin/)

  const source = await upload('#aa00aa')
  const sourceFiles = await readMediaRevision(fixture.revisionRoot, revision(source))
  const before = await fixture.payload.count({ collection: 'media', overrideAccess: true })
  const unauthorizedCrop = await crop(source, false)
  expect(unauthorizedCrop.status).toBe(403)
  const unauthorizedDuplicate = await fixture.request(`/api/media/${source.id}/duplicate`, {
    body: '{}', headers: { 'Content-Type': 'application/json' }, method: 'POST',
  }, false)
  expect(unauthorizedDuplicate.status).toBe(403)
  expect((await fixture.payload.count({ collection: 'media', overrideAccess: true })).totalDocs).toBe(before.totalDocs)
  const retained = await fixture.payload.findByID({ collection: 'media', id: source.id as number, overrideAccess: true })
  expect(revision(retained as unknown as Record<string, unknown>)).toBe(revision(source))
  expect(await readMediaRevision(fixture.revisionRoot, revision(source))).toEqual(sourceFiles)
})

it('rejects a native edit whose client Origin does not match the configured storage origin', async () => {
  const recorder = await startHTTPRequestRecorder()
  try {
    const source = await upload('#aa0000')
    for (const origin of [recorder.origin, undefined]) {
      const headers = new Headers({ Cookie: fixture.cookie, 'Content-Type': 'application/json' })
      if (origin) headers.set('Origin', origin)
      const response = await fetch(`${fixture.origin}${cropPath(source)}`, {
        body: JSON.stringify({
          alt: source.alt, filename: 'capture.png', storageRevision: source.storageRevision,
          url: `${recorder.origin}/capture`, _status: source._status,
        }),
        headers,
        method: 'PATCH',
        signal: AbortSignal.timeout(15_000),
      })
      expect(response.status).toBe(403)
    }
    const focalBypass = await fetch(`${fixture.origin}/api/media/${source.id}`, {
      body: JSON.stringify({
        alt: source.alt, filename: 'capture.png', focalX: 40, focalY: 40,
        storageRevision: source.storageRevision, url: `${recorder.origin}/capture`, _status: source._status,
      }),
      headers: { Cookie: fixture.cookie, 'Content-Type': 'application/json', Origin: recorder.origin },
      method: 'PATCH', signal: AbortSignal.timeout(15_000),
    })
    expect(focalBypass.status).toBe(403)
    for (const body of [
      { alt: 'No remote create', filename: 'capture.png', url: `${recorder.origin}/capture`, focalX: 40, focalY: 40 },
      { alt: 'No remote crop', filename: 'capture.png', url: `${recorder.origin}/capture` },
    ]) {
      const pathname = 'focalX' in body ? '/api/media' : `${cropPath({ id: '' })}`.replace('/api/media/?', '/api/media?')
      const create = await fixture.request(pathname, {
        body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST',
      })
      expect(create.status).toBe(400)
    }
    expect(recorder.requests).toEqual([])
    const retained = await fixture.payload.findByID({ collection: 'media', id: source.id as number, overrideAccess: true })
    expect(revision(retained as unknown as Record<string, unknown>)).toBe(revision(source))
  } finally {
    await recorder.close()
  }
})

it('uses only server-selected native edit selectors and rejects a forged storage revision before fetch', async () => {
  const recorder = await startHTTPRequestRecorder()
  try {
    const source = await upload('#aa00aa')
    const foreign = await upload('#00aaaa')
    const response = await crop(source, true, { filename: 'capture.png', url: `${recorder.origin}/capture` })
    expect(response.status).toBe(200)
    const edited = (await response.json()).doc as Record<string, unknown>
    const editedFiles = await readMediaRevision(fixture.revisionRoot, revision(edited))
    const editedOriginal = editedFiles.find((file) => file.name === edited.filename)
    if (!editedOriginal) throw new Error('Missing edited original')
    const pixel = await sharp(editedOriginal.bytes).raw().toBuffer()
    expect([...pixel.subarray(0, 3)]).toEqual([170, 0, 170])
    expect(recorder.requests).toEqual([])

    const forged = await crop(edited, true, {
      filename: foreign.filename, storageRevision: foreign.storageRevision, url: `${recorder.origin}/capture`,
    })
    expect(forged.status).toBe(400)
    expect(recorder.requests).toEqual([])
    const retained = await fixture.payload.findByID({ collection: 'media', id: edited.id as number, overrideAccess: true })
    expect(revision(retained as unknown as Record<string, unknown>)).toBe(revision(edited))
  } finally {
    await recorder.close()
  }
})
