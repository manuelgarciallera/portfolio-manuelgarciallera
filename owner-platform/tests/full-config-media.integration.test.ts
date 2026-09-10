import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { afterAll, expect, it, vi } from 'vitest'
import sharp from 'sharp'
vi.mock('server-only', () => ({}))
import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'

let fixture: MediaHTTPFixture
afterAll(async () => { await fixture?.close() })
it('edits a real CMS page using versioned media with the full owner configuration', async () => {
  const directory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit isolated QA directory required')
  const root = path.join(directory, `full-config-${randomUUID()}`)
  fixture = await startMediaHTTPFixture({ root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'scratch'),
    credentials: { email: 'full-config@example.invalid', password: randomUUID() + randomUUID() },
    secret: randomUUID() + randomUUID(), seed: true,
    database: { engine: 'sqlite', filename: path.join(root, 'full.db') }, fullOwnerConfig: true })
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
}, 60_000)
