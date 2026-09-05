import { randomUUID } from 'node:crypto'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, expect, it } from 'vitest'

import applicationConfig from '../src/payload.config'

let payload: Payload
let owner: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>

beforeAll(async () => {
  const config = await applicationConfig
  payload = await getPayload({
    key: `editorial-integration-${randomUUID()}`,
    config: {
      ...config,
      // Never connect to the developer's configured database or reuse their credentials.
      db: { ...sqliteAdapter({ client: { url: 'file::memory:' } }), allowIDOnCreate: false, name: 'sqlite' },
      secret: randomUUID() + randomUUID(),
    },
  })
  const email = 'editorial-test@example.invalid'
  const password = randomUUID() + randomUUID()
  await payload.create({ collection: 'users', data: { email, password, role: 'owner' }, overrideAccess: true })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const session = await payload.auth({ headers: new Headers({ Authorization: `JWT ${login.token}` }) })
  expect(session.user?.role).toBe('owner')
  owner = session.user!
}, 60_000)

afterAll(async () => { await payload?.destroy() })

it('saves, reorders and restores modular drafts with a real authenticated owner', async () => {
  const page = await payload.create({
    collection: 'pages', draft: true, overrideAccess: false, user: owner,
    data: { title: 'Original draft', slug: 'integration-page', layout: [
      { blockType: 'hero', heading: 'First' },
      { blockType: 'hero', heading: 'Second' },
    ] },
  }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  const originalVersions = await payload.findVersions({ collection: 'pages', overrideAccess: false, user: owner, where: { parent: { equals: page.id } }, sort: '-createdAt' })
  expect(originalVersions.docs.length).toBeGreaterThan(0)
  await payload.update({ collection: 'pages', id: page.id, draft: true, overrideAccess: false, user: owner, data: {
    title: 'Reordered draft', layout: [...page.layout!].reverse(),
  } }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  const changed = await payload.findByID({ collection: 'pages', id: page.id, draft: true, overrideAccess: false, user: owner })
  expect(changed.layout?.map((block) => block.blockType === 'hero' ? block.heading : '')).toEqual(['Second', 'First'])
  const anonymous = await payload.find({ collection: 'pages', draft: true, overrideAccess: false, where: { id: { equals: page.id } } })
  expect(anonymous.totalDocs).toBe(0)
  await expect(payload.findVersions({ collection: 'pages', overrideAccess: false })).rejects.toThrow()
  await expect(payload.update({ collection: 'pages', id: page.id, overrideAccess: false, data: { title: 'Unauthorized' } })).rejects.toThrow()
  await payload.restoreVersion({ collection: 'pages', id: originalVersions.docs[0].id, overrideAccess: false, user: owner })
  const restored = await payload.findByID({ collection: 'pages', id: page.id, draft: true, overrideAccess: false, user: owner })
  expect(restored.title).toBe('Original draft')
  expect(restored.layout?.map((block) => block.blockType === 'hero' ? block.heading : '')).toEqual(['First', 'Second'])
  expect(restored._status).toBe('draft')
}, 30_000)

it('keeps unpublished article edits and version history out of anonymous reads', async () => {
  const article = await payload.create({ collection: 'articles', overrideAccess: false, user: owner, data: {
    title: 'Published title', slug: 'integration-article', excerpt: 'Public excerpt', _status: 'published',
    content: { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Public text', format: 0, detail: 0, mode: 'normal', style: '' }] },
    ] } },
  } })
  await payload.update({ collection: 'articles', id: article.id, draft: true, overrideAccess: false, user: owner, data: { title: 'Private draft title' } })
  const draft = await payload.findByID({ collection: 'articles', id: article.id, draft: true, overrideAccess: false, user: owner })
  expect(draft.title).toBe('Private draft title')
  for (const draft of [false, true]) {
    const visible = await payload.findByID({ collection: 'articles', id: article.id, draft, overrideAccess: false })
    expect(visible.title).toBe('Published title')
  }
  await expect(payload.findVersions({ collection: 'articles', overrideAccess: false })).rejects.toThrow()
}, 30_000)
