import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

// This suite runs in Node, outside Next's react-server module condition. Only
// its build-time marker is substituted; services and persistence remain real.
vi.mock('server-only', () => ({}))

import applicationConfig, { createLocalDatabaseAdapter } from '../src/payload.config'
import { loadContentVisualPreview, loadPageVisualPreview } from '../src/preview/visual-service'
import { createPagePreviewSnapshot } from '../src/preview/service'
import { createPageDraftSnapshot } from '../src/recovery/service'
import { createOwnerRelease } from '../src/releases/service'
import { prepareOwnerRestorePlan } from '../src/restore/prepare'
import { confirmOwnerRestorePlan } from '../src/restore/service'
import { executeOwnerRestorePlan } from '../src/restore/execute'
import { createOwnerPublicationBundle } from '../src/publication/service'
import { createOwnerPublicationReview } from '../src/publication/review-service'
import { createOwnerPublicationArtifact } from '../src/publication/artifact-service'
import { createOwnerPublicationPreflight } from '../src/publication/preflight-service'

let payload: Payload
let owner: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>
let databaseDirectory: string | undefined
let rejectRestoreAudit = false
const databasePrefix = path.join(tmpdir(), 'owner-editorial-qa-')

beforeAll(async () => {
  const config = await applicationConfig
  databaseDirectory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!databaseDirectory || !path.resolve(databaseDirectory).startsWith(path.resolve(databasePrefix))) throw new Error('Run integration tests through npm run test:integration for isolated database cleanup')
  payload = await getPayload({
    key: `editorial-integration-${randomUUID()}`,
    config: {
      ...config,
      // Exercise real upload metadata without leaving files in the owner's media library.
      collections: config.collections.map((collection) => collection.slug === 'media' ? { ...collection, upload: { ...collection.upload, disableLocalStorage: true } } : collection.slug === 'audit-events' ? {
        ...collection, hooks: { ...collection.hooks, beforeChange: [({ data }) => {
          if (rejectRestoreAudit && data.action === 'restore.executed') throw new Error('QA restore audit unavailable')
          return data
        }, ...(collection.hooks.beforeChange ?? [])] },
      } : collection),
      // Never connect to the developer's configured database or reuse their credentials.
      // libSQL transactions use separate connections; use a private temporary
      // file so every connection shares the schema, never the owner's database.
      db: { ...createLocalDatabaseAdapter(`file:${path.join(databaseDirectory, 'editorial.db').replaceAll('\\', '/')}`), allowIDOnCreate: false, name: 'sqlite' },
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

afterAll(async () => {
  const client = (payload?.db as unknown as { client?: { close(): void } })?.client
  await payload?.destroy()
  client?.close()
})

const createReleaseFixture = async () => {
  const suffix = randomUUID()
  const brand = await payload.create({ collection: 'brand-profiles', overrideAccess: false, user: owner, data: {
    name: 'Release brand', slug: `release-brand-${suffix}`, _status: 'published',
    colors: [
      { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
    ],
    usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } })
  const page = await payload.create({ collection: 'pages', draft: true, overrideAccess: false, user: owner, data: {
    title: 'Release page', slug: `release-page-${suffix}`, brandProfile: brand.id, layout: [{ blockType: 'hero', heading: 'Snapshot source' }],
  } })
  const req = await createLocalReq({ user: owner }, payload)
  const preview = await createPagePreviewSnapshot({ payload, req, pageId: page.id })
  const draft = await createPageDraftSnapshot({ payload: payload as never, req, pageId: page.id })
  const release = await createOwnerRelease({ payload: payload as never, req, input: {
    name: 'Integration release', changeSummary: 'Synthetic evidence', gitCommit: suffix.replaceAll('-', '').padEnd(40, 'a'), previewSnapshot: preview.id, draftSnapshot: draft.id,
    quality: [{ viewport: 'desktop', performance: 80, usability: 80, accessibility: 80, source: 'manual', measuredAt: '2026-09-05T08:00:00.000Z' }],
  } }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  return { page, req, release }
}

it('registers a real immutable release from a matched snapshot pair', async () => {
  const { release } = await createReleaseFixture()
  expect(release.name).toBe('Integration release')
  await expect(payload.update({ collection: 'releases', id: release.id as number, overrideAccess: false, user: owner, data: { name: 'Rewritten' } })).rejects.toThrow()
  await expect(payload.find({ collection: 'releases', overrideAccess: false })).rejects.toThrow()
}, 30_000)

it('reviews a real publication bundle addressed by a URL id and generates its artifact without editing the page', async () => {
  const { page, req, release } = await createReleaseFixture()
  const bundle = await createOwnerPublicationBundle({ payload: payload as never, req, name: 'QA publication', releaseIds: [release.id as number], confirmation: 'PREPARAR PUBLICACIÓN' })
  const before = await payload.findByID({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false })
  const review = await createOwnerPublicationReview({ payload: payload as never, req, bundleId: String(bundle.id), decision: 'approved', confirmation: 'APROBAR PAQUETE' }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  expect(review.decision).toBe('approved')
  const artifact = await createOwnerPublicationArtifact({ payload: payload as never, req, reviewId: String(review.id), confirmation: 'GENERAR ARTEFACTO' }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  expect(artifact.pageCount).toBe(1)
  const preflight = await createOwnerPublicationPreflight({ payload: payload as never, req, artifactId: String(artifact.id) }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  expect(preflight.pageCount).toBe(1)
  const storedPreflight = await payload.findByID({ collection: 'publication-preflights', id: preflight.id as number, depth: 0, user: owner, overrideAccess: false })
  expect(storedPreflight.artifact).toBe(artifact.id)
  expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false })).toEqual(before)
}, 30_000)

it('restores the captured page as a draft while preserving the published revision', async () => {
  const { page, req, release } = await createReleaseFixture()
  await payload.update({ collection: 'pages', id: page.id, user: owner, overrideAccess: false, data: {
    _status: 'published', title: 'Published revision', layout: [{ blockType: 'hero', heading: 'Keep published content' }],
  } })
  const plan = await prepareOwnerRestorePlan({ payload: payload as never, releaseId: release.id as number, req }).catch((error) => { throw new Error(JSON.stringify(error.data ?? error.message)) })
  expect(plan.status).toBe('ready')
  const current = await createPagePreviewSnapshot({ payload, req, pageId: page.id })
  const baselineId = typeof plan.baselineSnapshot === 'object' ? (plan.baselineSnapshot as { id: number }).id : plan.baselineSnapshot
  expect(current.id).toBe(baselineId)
  const confirmed = await confirmOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, currentSnapshot: current.id, confirmation: 'CONFIRMAR RESTAURACIÓN' })
  expect(confirmed.status).toBe('confirmed')
  const restored = await executeOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, confirmation: 'EJECUTAR RESTAURACIÓN' })
  expect(restored.status).toBe('executed')
  const draft = await payload.findByID({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false })
  expect(draft.title).toBe('Release page')
  expect(draft.layout?.[0]).toMatchObject({ blockType: 'hero', heading: 'Snapshot source' })
  expect(draft._status).toBe('draft')
  const published = await payload.findByID({ collection: 'pages', id: page.id, draft: false, user: owner, overrideAccess: false })
  expect(published.title).toBe('Published revision')
  expect(published.layout?.[0]).toMatchObject({ blockType: 'hero', heading: 'Keep published content' })
  expect(published._status).toBe('published')
  const history = await payload.findVersions({ collection: 'pages', user: owner, overrideAccess: false, where: { and: [{ parent: { equals: page.id } }, { 'version.title': { equals: 'Published revision' } }] } })
  expect(history.totalDocs).toBeGreaterThan(0)
  await expect(executeOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, confirmation: 'EJECUTAR RESTAURACIÓN' })).rejects.toThrow(/confirmado/i)
}, 30_000)

it('rolls back page, result snapshots and plan when the restore audit cannot be saved', async () => {
  const { page, req, release } = await createReleaseFixture()
  await payload.update({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false, data: {
    title: 'Latest draft to preserve', layout: [{ blockType: 'hero', heading: 'Keep this on failure' }],
  } })
  const plan = await prepareOwnerRestorePlan({ payload: payload as never, releaseId: release.id as number, req })
  const current = await createPagePreviewSnapshot({ payload, req, pageId: page.id })
  await confirmOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, currentSnapshot: current.id, confirmation: 'CONFIRMAR RESTAURACIÓN' })
  const counts = async () => Promise.all((['draft-snapshots', 'preview-snapshots', 'audit-events'] as const).map(async (collection) => (await payload.count({ collection, user: owner, overrideAccess: false })).totalDocs))
  const before = await counts()
  const versionIds = async () => (await payload.findVersions({ collection: 'pages', user: owner, overrideAccess: false, limit: 1000, where: { parent: { equals: page.id } } })).docs.map(({ id }) => id).sort()
  const previousVersions = await versionIds()
  rejectRestoreAudit = true
  try {
    await expect(executeOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, confirmation: 'EJECUTAR RESTAURACIÓN' })).rejects.toThrow('QA restore audit unavailable')
  } finally { rejectRestoreAudit = false }
  expect(await counts()).toEqual(before)
  expect(await versionIds()).toEqual(previousVersions)
  const retained = await payload.findByID({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false })
  expect(retained.title).toBe('Latest draft to preserve')
  expect(retained.layout?.[0]).toMatchObject({ heading: 'Keep this on failure' })
  const unchangedPlan = await payload.findByID({ collection: 'restore-plans', id: plan.id as number, user: owner, overrideAccess: false })
  expect(unchangedPlan.status).toBe('confirmed')
  expect(unchangedPlan.resultDraftSnapshot).toBeNull()
}, 30_000)

it('refuses a confirmed restore after a newer draft edit without overwriting it', async () => {
  const { page, req, release } = await createReleaseFixture()
  const plan = await prepareOwnerRestorePlan({ payload: payload as never, releaseId: release.id as number, req })
  const current = await createPagePreviewSnapshot({ payload, req, pageId: page.id })
  await confirmOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, currentSnapshot: current.id, confirmation: 'CONFIRMAR RESTAURACIÓN' })
  await payload.update({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false, data: { title: 'A newer edit must survive' } })
  await expect(executeOwnerRestorePlan({ payload: payload as never, req, planId: plan.id as number, confirmation: 'EJECUTAR RESTAURACIÓN' })).rejects.toThrow(/cambió después de confirmar/i)
  expect((await payload.findByID({ collection: 'pages', id: page.id, draft: true, user: owner, overrideAccess: false })).title).toBe('A newer edit must survive')
  const retained = await payload.findByID({ collection: 'restore-plans', id: plan.id as number, user: owner, overrideAccess: false })
  expect(retained.status).toBe('confirmed')
  expect(retained.resultDraftSnapshot).toBeNull()
  await expect(payload.update({ collection: 'restore-plans', id: plan.id as number, user: owner, overrideAccess: false, data: { status: 'executed' } })).rejects.toThrow()
}, 30_000)

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
