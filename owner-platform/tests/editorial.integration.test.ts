import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, expect, it } from 'vitest'

import applicationConfig from '../src/payload.config'
import { loadContentVisualPreview, loadPageVisualPreview } from '../src/preview/visual-service'

let payload: Payload
let owner: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>

beforeAll(async () => {
  const config = await applicationConfig
  payload = await getPayload({
    key: `editorial-integration-${randomUUID()}`,
    config: {
      ...config,
      // Exercise real upload metadata without leaving files in the owner's media library.
      collections: config.collections.map((collection) => collection.slug === 'media' ? { ...collection, upload: { ...collection.upload, disableLocalStorage: true } } : collection),
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

it.each(['articles', 'projects'] as const)('saves %s composed only of blocks without requiring hidden legacy text', async (collection) => {
  let heroImage: number | undefined
  if (collection === 'projects') {
    const bytes = await readFile(new URL('../../public/art/hero-refractive-orb-fallback-v2.webp', import.meta.url))
    const media = await payload.create({ collection: 'media', overrideAccess: false, user: owner, data: { alt: 'Modular project' }, file: {
      data: bytes, name: `modular-${randomUUID()}.webp`, mimetype: 'image/webp', size: bytes.length,
    } })
    heroImage = media.id
  }
  const layoutKey = collection === 'articles' ? 'articleLayout' : 'caseStudyLayout'
  const data = {
    title: 'Only modular content', slug: `modular-${collection}`, excerpt: 'Article introduction', summary: 'Project introduction', heroImage,
    [layoutKey]: [{ blockType: collection === 'articles' ? 'articleQuote' : 'caseQuote', quote: 'Actual editorial content' }],
  }
  const draft = await payload.create({ collection, draft: true, overrideAccess: false, user: owner, data: data as never })
  const legacyKey = collection === 'articles' ? 'content' : 'body'
  expect((draft as unknown as Record<string, unknown>)[legacyKey] ?? null).toBeNull()
  const published = await payload.update({ collection, id: draft.id, overrideAccess: false, user: owner, data: { _status: 'published', title: 'Modular publication' } })
  expect(published._status).toBe('published')
  const preview = await loadContentVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload), collection, documentId: String(draft.id) })
  expect(preview.blocks.map((block) => block.type)).toEqual(['hero', 'quote'])
  expect(preview.blocks[1].quote).toBe('Actual editorial content')
  await expect(payload.update({ collection, id: draft.id, draft: true, overrideAccess: false, user: owner, data: { [layoutKey]: [] } })).rejects.toThrow()
  const retained = await payload.findByID({ collection, id: draft.id, draft: true, overrideAccess: false, user: owner })
  expect((retained as unknown as Record<string, unknown[]>)[layoutKey]).toHaveLength(1)
  await expect(payload.create({ collection, draft: true, overrideAccess: false, user: owner, data: { ...data, slug: `empty-${collection}`, [layoutKey]: [] } as never })).rejects.toThrow()
  await expect(payload.create({ collection, draft: true, overrideAccess: false, user: owner, data: {
    ...data, slug: `empty-editor-${collection}`, [layoutKey]: [],
    [legacyKey]: { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'paragraph', version: 1, children: [] }] } },
  } as never })).rejects.toThrow()
}, 30_000)

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
  const visual = await loadPageVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload), pageId: String(page.id) })
  expect(visual.blocks.map((block) => block.heading)).toEqual(['First', 'Second'])
  expect(visual.status).toBe('draft')
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
  const visual = await loadContentVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload), collection: 'articles', documentId: String(article.id) })
  expect(visual.title).toBe('Private draft title')
  expect(visual.blocks.map((block) => block.type)).toEqual(['hero', 'richText'])
  expect(JSON.stringify(visual.blocks[1].content)).toContain('Public text')
  await payload.update({ collection: 'articles', id: article.id, draft: true, overrideAccess: false, user: owner, data: {
    articleLayout: [{ blockType: 'articleQuote', quote: 'Modular quote', attribution: 'Test author' }],
  } })
  const modular = await loadContentVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload), collection: 'articles', documentId: String(article.id) })
  expect(modular.blocks.map((block) => block.type)).toEqual(['hero', 'quote'])
  expect(modular.blocks[1].quote).toBe('Modular quote')
  await payload.update({ collection: 'articles', id: article.id, draft: true, overrideAccess: false, user: owner, data: { articleLayout: [] } })
  const classicAgain = await loadContentVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload), collection: 'articles', documentId: String(article.id) })
  expect(classicAgain.blocks.map((block) => block.type)).toEqual(['hero', 'richText'])
  expect(JSON.stringify(classicAgain.blocks[1].content)).toContain('Public text')
  for (const draft of [false, true]) {
    const visible = await payload.findByID({ collection: 'articles', id: article.id, draft, overrideAccess: false })
    expect(visible.title).toBe('Published title')
  }
  await expect(payload.findVersions({ collection: 'articles', overrideAccess: false })).rejects.toThrow()
}, 30_000)

it('previews project metrics and quotes in their saved draft order', async () => {
  const bytes = await readFile(new URL('../../public/art/hero-refractive-orb-fallback-v2.webp', import.meta.url))
  const media = await payload.create({ collection: 'media', overrideAccess: false, user: owner, data: { alt: 'Integration image' }, file: {
    data: bytes, name: `integration-${randomUUID()}.webp`, mimetype: 'image/webp', size: bytes.length,
  } })
  const project = await payload.create({ collection: 'projects', draft: true, overrideAccess: false, user: owner, data: {
    title: 'Draft project', slug: 'integration-project', summary: 'Project summary',
    heroImage: media.id,
    body: { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Legacy project body', format: 0, detail: 0, mode: 'normal', style: '' }] },
    ] } },
    caseStudyLayout: [
      { blockType: 'caseMetrics', items: [{ value: '3', label: 'Roles' }] },
      { blockType: 'caseQuote', quote: 'A finding', attribution: 'Research' },
    ],
  } })
  const visual = await loadContentVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload), collection: 'projects', documentId: String(project.id) })
  expect(visual.blocks.map((block) => block.type)).toEqual(['hero', 'metrics', 'quote'])
  expect(visual.blocks[1].metrics).toEqual([{ value: '3', label: 'Roles' }])
  expect(visual.blocks[0].description).toBe('Project summary')
  expect(visual.assets[String(media.id)].alt).toBe('Integration image')
}, 30_000)
