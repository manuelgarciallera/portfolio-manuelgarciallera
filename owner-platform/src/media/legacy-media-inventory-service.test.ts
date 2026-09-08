import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Payload, PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { inspectPayloadLegacyMedia } from './legacy-media-inventory-service'

type Page = {
  docs: unknown[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  pagingCounter: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
}

const emptyPage = (): Page => ({
  docs: [],
  hasNextPage: false,
  hasPrevPage: false,
  limit: 100,
  nextPage: null,
  page: 1,
  pagingCounter: 1,
  prevPage: null,
  totalDocs: 0,
  totalPages: 1,
})

const ownerRequest = (overrides: Partial<PayloadRequest> = {}): PayloadRequest => ({
  user: { collection: 'users', id: 7, role: 'owner' },
  ...overrides,
} as PayloadRequest)

type ReadBoundary = (options: Record<string, unknown>) => Promise<unknown>
type RollbackBoundary = (transactionID: unknown) => Promise<void>

const fakePayload = ({
  find = vi.fn(async () => emptyPage()) as ReadBoundary,
  findVersions = vi.fn(async () => emptyPage()) as ReadBoundary,
  rollbackTransaction = vi.fn(async () => undefined) as RollbackBoundary,
}: {
  find?: ReadBoundary
  findVersions?: ReadBoundary
  rollbackTransaction?: RollbackBoundary
} = {}) => ({
  find,
  findVersions,
  db: { rollbackTransaction },
} as unknown as Payload)

describe('inspectPayloadLegacyMedia', () => {
  let root: string
  const createdFiles: string[] = []

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'owner-payload-inventory-unit-'))
  })

  afterEach(async () => {
    while (createdFiles.length > 0) await unlink(createdFiles.pop()!)
    await rmdir(root)
  })

  it.each([
    ['anonymous', undefined],
    ['a non-owner user', { collection: 'users', id: 8, role: 'editor' }],
  ])('rejects %s before any database or filesystem access', async (_label, user) => {
    const find = vi.fn(async () => { throw new Error('database boundary reached') })
    const payload = fakePayload({ find })

    await expect(inspectPayloadLegacyMedia({
      payload,
      req: { user } as PayloadRequest,
      root: join(root, 'missing'),
    })).rejects.toMatchObject({ status: 403 })
    expect(find).not.toHaveBeenCalled()
  })

  it.each([
    ['a numeric zero transaction ID', 0],
    ['a scalar transaction ID', 'active-transaction'],
    ['an unresolved transaction ID', new Promise<string>(() => undefined)],
  ])('rejects %s unchanged before find, rollback or filesystem access', async (_label, transactionID) => {
    const find = vi.fn(async () => { throw new Error('database boundary reached') })
    const rollbackTransaction = vi.fn(async () => { throw new Error('rollback boundary reached') })
    const payload = fakePayload({ find, rollbackTransaction })
    const req = ownerRequest({ transactionID })

    await expect(inspectPayloadLegacyMedia({
      payload,
      req,
      root: join(root, 'missing'),
    })).rejects.toMatchObject({ status: 409 })
    expect(req.transactionID).toBe(transactionID)
    expect(find).not.toHaveBeenCalled()
    expect(rollbackTransaction).not.toHaveBeenCalled()
  })

  it('collects independent document, latest draft, version and verified snapshot references', async () => {
    const currentPath = join(root, 'same-name.png')
    createdFiles.push(currentPath)
    await writeFile(currentPath, Buffer.from('synthetic blue B'))
    const manifest = createPreviewManifest({
      source: { collection: 'pages', documentId: 'page-1', versionId: 'current:one' },
      brandTokens: {},
      pageBlocks: [],
      mediaReferences: [{
        id: '41',
        filename: 'same-name.png',
        storage: 'legacy-unverified',
      }],
    })
    const find = vi.fn(async (options: Record<string, unknown>) => {
      if (options.collection === 'media' && options.draft === false) return {
        ...emptyPage(), totalDocs: 1, docs: [{
          id: 41,
          _status: 'published',
          filename: 'same-name.png',
          filesize: 16,
          sizes: {
            small: { filename: 'small-current.png', filesize: 5 },
            large: { filename: undefined, filesize: undefined },
          },
        }],
      }
      if (options.collection === 'media' && options.draft === true) return {
        ...emptyPage(), totalDocs: 1, docs: [{
          id: 41,
          _status: 'draft',
          filename: 'draft-only.png',
          filesize: 17,
          sizes: { small: { filename: 'small-draft.png', filesize: 6 } },
        }],
      }
      if (options.collection === 'preview-snapshots') return {
        ...emptyPage(), totalDocs: 1, docs: [{
          id: 'snapshot-1',
          schemaVersion: manifest.schemaVersion,
          sourceCollection: manifest.source.collection,
          sourceDocumentId: manifest.source.documentId,
          sourceVersionId: manifest.source.versionId,
          manifest,
          manifestHash: manifest.hash,
        }],
      }
      throw new Error('unexpected find call')
    })
    const findVersions = vi.fn(async () => ({
      ...emptyPage(), totalDocs: 1, docs: [{
        id: 'version-1',
        parent: { id: 41 },
        version: {
          _status: 'published',
          filename: 'same-name.png',
          filesize: 16,
          sizes: { small: { filename: 'small-old.png', filesize: 4 } },
        },
      }],
    }))
    const req = ownerRequest()

    const report = await inspectPayloadLegacyMedia({ payload: fakePayload({ find, findVersions }), req, root })

    expect(report.references.map(({ kind, documentId, referenceId, state, status }) => ({
      kind, documentId, referenceId, state, status,
    }))).toEqual([
      { kind: 'document', documentId: '41', referenceId: '41', state: 'published', status: 'incomplete' },
      { kind: 'draft', documentId: '41', referenceId: '41', state: 'draft', status: 'incomplete' },
      { kind: 'snapshot', documentId: '41', referenceId: 'snapshot-1', state: 'unknown', status: 'historical-unverified' },
      { kind: 'version', documentId: '41', referenceId: 'version-1', state: 'published', status: 'incomplete' },
    ])
    expect(report.references[0].files).toEqual([
      { variant: 'large' },
      { variant: 'original', filename: 'same-name.png', expectedBytes: 16 },
      { variant: 'small', filename: 'small-current.png', expectedBytes: 5 },
    ])
    expect(report.references[2].files).toEqual([{ variant: 'original', filename: 'same-name.png' }])
    expect(report.references[2].observedFiles).toEqual([{
      filename: 'same-name.png', status: 'present', bytes: 16,
      sha256: '29ba8d1a5265485b6c345d4fec2cc5702f0ef6a8187a026f91064c51fabf118f',
    }])
    expect(find).toHaveBeenCalledTimes(3)
    for (const options of find.mock.calls.map(([value]) => value)) {
      expect(options).toMatchObject({ depth: 0, limit: 100, overrideAccess: false, page: 1, pagination: true, req, sort: 'id' })
    }
    expect(find.mock.calls[0][0]).toMatchObject({ collection: 'media', draft: false, trash: true })
    expect(find.mock.calls[1][0]).toMatchObject({ collection: 'media', draft: true, trash: true })
    expect(find.mock.calls[2][0]).toMatchObject({ collection: 'preview-snapshots' })
    expect(findVersions).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'media', depth: 0, limit: 100, overrideAccess: false,
      page: 1, pagination: true, req, sort: 'id', trash: true,
    }))
  })

  it('traverses every declared page without duplicating a published row as a draft', async () => {
    const first = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      _status: 'published',
      filename: `missing-${index + 1}.png`,
    }))
    const publishedPages = [
      { ...emptyPage(), docs: first, hasNextPage: true, nextPage: 2, totalDocs: 101, totalPages: 2 },
      { ...emptyPage(), docs: [{ id: 101, _status: 'published', filename: 'missing-101.png' }], hasPrevPage: true, page: 2, pagingCounter: 101, prevPage: 1, totalDocs: 101, totalPages: 2 },
    ]
    const find = vi.fn(async (options: Record<string, unknown>) => {
      if (options.collection === 'media' && options.draft === false) return publishedPages[(options.page as number) - 1]
      if (options.collection === 'media' && options.draft === true) return {
        ...emptyPage(), docs: first.slice(0, 1), totalDocs: 1,
      }
      return emptyPage()
    })

    const report = await inspectPayloadLegacyMedia({ payload: fakePayload({ find }), req: ownerRequest(), root })

    expect(report.references).toHaveLength(101)
    expect(report.references.every(({ kind }) => kind === 'document')).toBe(true)
    expect(find.mock.calls.filter(([options]) => options.collection === 'media' && options.draft === false)
      .map(([options]) => options.page)).toEqual([1, 2])
  })

  it.each([
    ['malformed totals', { ...emptyPage(), totalDocs: -1 }],
    ['declared truncation', { ...emptyPage(), docs: [{ id: 1 }], totalDocs: 2 }],
    ['duplicate row IDs', { ...emptyPage(), docs: [{ id: 1 }, { id: 1 }], totalDocs: 2 }],
  ])('rejects %s instead of returning a partial inventory', async (_label, malformed) => {
    const find = vi.fn(async () => malformed)

    await expect(inspectPayloadLegacyMedia({
      payload: fakePayload({ find }), req: ownerRequest(), root,
    })).rejects.toThrow(/pagination|page|duplicate|total/u)
  })

  it('rejects a stalled second page after a valid full first page', async () => {
    const first = Array.from({ length: 100 }, (_, index) => ({ id: index + 1 }))
    const find = vi.fn(async (options: Record<string, unknown>) => options.page === 1
      ? { ...emptyPage(), docs: first, totalDocs: 101, totalPages: 2, hasNextPage: true, nextPage: 2 }
      : {
        ...emptyPage(), page: 2, pagingCounter: 101, totalDocs: 101, totalPages: 2,
        hasPrevPage: true, prevPage: 1,
      })

    await expect(inspectPayloadLegacyMedia({
      payload: fakePayload({ find }), req: ownerRequest(), root,
    })).rejects.toThrow(/pagination|page|truncated/u)
    expect(find).toHaveBeenCalledTimes(2)
  })

  it('rejects unsupported version parents and duplicate media identities in a snapshot', async () => {
    const badParent = fakePayload({
      findVersions: vi.fn(async () => ({
        ...emptyPage(), totalDocs: 1,
        docs: [{ id: 'version-1', parent: { value: 41 }, version: {} }],
      })),
    })
    await expect(inspectPayloadLegacyMedia({ payload: badParent, req: ownerRequest(), root }))
      .rejects.toThrow(/identity/u)

    const manifest = createPreviewManifest({
      source: { collection: 'pages', documentId: 'page-1', versionId: 'current:one' },
      brandTokens: {}, pageBlocks: [],
      mediaReferences: [
        { id: '41', filename: 'one.png', storage: 'legacy-unverified' },
        { id: '41', filename: 'two.png', storage: 'legacy-unverified' },
      ],
    })
    const duplicateSnapshot = fakePayload({
      find: vi.fn(async (options: Record<string, unknown>) => options.collection === 'preview-snapshots'
        ? { ...emptyPage(), totalDocs: 1, docs: [{
          id: 'snapshot-1', schemaVersion: 1, sourceCollection: 'pages',
          sourceDocumentId: 'page-1', sourceVersionId: 'current:one',
          manifest, manifestHash: manifest.hash,
        }] }
        : emptyPage()),
    })
    await expect(inspectPayloadLegacyMedia({ payload: duplicateSnapshot, req: ownerRequest(), root }))
      .rejects.toThrow(/duplicate media/u)
  })

  it('propagates denied version reads and corrupt snapshot hashes', async () => {
    const denial = new Error('You are not allowed to perform this action.')
    await expect(inspectPayloadLegacyMedia({
      payload: fakePayload({ findVersions: vi.fn(async () => { throw denial }) }),
      req: ownerRequest(), root,
    })).rejects.toBe(denial)

    const manifest = createPreviewManifest({
      source: { collection: 'pages', documentId: 'page-1', versionId: 'current:one' },
      brandTokens: {}, pageBlocks: [], mediaReferences: [],
    })
    const corrupt = fakePayload({
      find: vi.fn(async (options: Record<string, unknown>) => options.collection === 'preview-snapshots'
        ? { ...emptyPage(), totalDocs: 1, docs: [{
          id: 'snapshot-1', schemaVersion: 1, sourceCollection: 'pages',
          sourceDocumentId: 'page-1', sourceVersionId: 'current:one',
          manifest, manifestHash: 'sha256:' + '0'.repeat(64),
        }] }
        : emptyPage()),
    })
    await expect(inspectPayloadLegacyMedia({ payload: corrupt, req: ownerRequest(), root }))
      .rejects.toThrow(/hash/u)
  })

  it.each([
    ['legacy storage with a revision', 'legacy-unverified'],
    ['an unknown storage discriminator', 'unexpected'],
    ['a missing storage discriminator', undefined],
  ])('reports %s instead of treating it as versioned', async (_label, storage) => {
    const mediaReference = {
      id: '41', filename: 'missing.png',
      ...(storage === undefined ? {} : { storage }),
      storageRevision: '123e4567-e89b-42d3-a456-426614174000',
    }
    const manifest = createPreviewManifest({
      source: { collection: 'pages', documentId: 'page-1', versionId: 'current:one' },
      brandTokens: {}, pageBlocks: [],
      mediaReferences: [mediaReference],
    })
    const payload = fakePayload({
      find: vi.fn(async (options: Record<string, unknown>) => options.collection === 'preview-snapshots'
        ? { ...emptyPage(), totalDocs: 1, docs: [{
          id: 'snapshot-1', schemaVersion: 1, sourceCollection: 'pages',
          sourceDocumentId: 'page-1', sourceVersionId: 'current:one',
          manifest, manifestHash: manifest.hash,
        }] }
        : emptyPage()),
    })

    const report = await inspectPayloadLegacyMedia({ payload, req: ownerRequest(), root })

    expect(report.references[0].status).toBe('incomplete')
    expect(report.references[0].issues).toEqual([
      'invalid-storage-revision',
      'missing-file:original',
    ])
  })

  it('preserves an explicitly versioned snapshot revision without inspecting legacy bytes', async () => {
    const revision = '123e4567-e89b-42d3-a456-426614174000'
    const manifest = createPreviewManifest({
      source: { collection: 'pages', documentId: 'page-1', versionId: 'current:one' },
      brandTokens: {}, pageBlocks: [],
      mediaReferences: [{ id: '41', storage: 'versioned', storageRevision: revision }],
    })
    const payload = fakePayload({
      find: vi.fn(async (options: Record<string, unknown>) => options.collection === 'preview-snapshots'
        ? { ...emptyPage(), totalDocs: 1, docs: [{
          id: 'snapshot-1', schemaVersion: 1, sourceCollection: 'pages',
          sourceDocumentId: 'page-1', sourceVersionId: 'current:one',
          manifest, manifestHash: manifest.hash,
        }] }
        : emptyPage()),
    })

    const report = await inspectPayloadLegacyMedia({ payload, req: ownerRequest(), root })

    expect(report.references[0]).toMatchObject({
      status: 'versioned-not-inspected', storageRevision: revision, observedFiles: [],
    })
  })

  it('rejects an excessive declared source before traversing further pages', async () => {
    const find = vi.fn(async (options: Record<string, unknown>) => {
      const page = options.page as number
      const start = (page - 1) * 100
      const remaining = 10_001 - start
      const docs = Array.from({ length: Math.min(100, remaining) }, (_, index) => ({
        id: start + index + 1,
        _status: 'published',
        filename: `missing-${start + index + 1}.png`,
      }))
      return {
        ...emptyPage(), docs, totalDocs: 10_001, totalPages: 101,
        hasNextPage: page < 101, nextPage: page < 101 ? page + 1 : null,
        hasPrevPage: page > 1, prevPage: page > 1 ? page - 1 : null,
        page, pagingCounter: start + 1,
      }
    })

    await expect(inspectPayloadLegacyMedia({
      payload: fakePayload({ find }), req: ownerRequest(), root,
    })).rejects.toThrow(/10,000|bounded|limit/u)
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('applies the 10,000 reference cap across collections', async () => {
    const paged = (page: number, totalDocs: number, status: 'draft' | 'published') => {
      const start = (page - 1) * 100
      const docs = Array.from({ length: Math.min(100, totalDocs - start) }, (_, index) => ({
        id: `${status}-${start + index + 1}`,
        _status: status,
        filename: `missing-${status}-${start + index + 1}.png`,
      }))
      const totalPages = Math.ceil(totalDocs / 100)
      return {
        ...emptyPage(), docs, totalDocs, totalPages,
        hasNextPage: page < totalPages, nextPage: page < totalPages ? page + 1 : null,
        hasPrevPage: page > 1, prevPage: page > 1 ? page - 1 : null,
        page, pagingCounter: start + 1,
      }
    }
    const find = vi.fn(async (options: Record<string, unknown>) => {
      if (options.collection === 'media') {
        return paged(options.page as number, 5_000, options.draft ? 'draft' : 'published')
      }
      throw new Error('Snapshot reads must not start after the reference cap is exceeded.')
    })
    const findVersions = vi.fn(async () => ({
      ...emptyPage(), totalDocs: 1,
      docs: [{ id: 'version-over-limit', parent: 'published-1', version: {} }],
    }))

    await expect(inspectPayloadLegacyMedia({
      payload: fakePayload({ find, findVersions }), req: ownerRequest(), root,
    })).rejects.toThrow(/global 10,000 reference limit/u)
    expect(find.mock.calls.filter(([options]) => options.collection === 'preview-snapshots'))
      .toHaveLength(0)
  })
})
