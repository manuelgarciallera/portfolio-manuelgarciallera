import { APIError, type Payload, type PayloadRequest } from 'payload'

import { isOwner } from '../access/owner'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import {
  inspectLegacyMediaInventory,
  type LegacyMediaInventory,
  type LegacyMediaReference,
} from './legacy-media-inventory'

const PAGE_LIMIT = 100
const MAX_REFERENCES = 10_000
const MAX_NORMALIZED_REFERENCE_BYTES = 8 * 1024 * 1024

type Row = Record<string, unknown>
type SourceScalar = bigint | boolean | null | number | string | undefined
type RetainedBudget = { normalizedBytes: number }

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

const record = (value: unknown, label: string): Row => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(label + ' must be an object.')
  }
  return value as Row
}

const denseArray = (value: unknown, label: string): unknown[] => {
  if (!Array.isArray(value)) throw new TypeError(label + ' must be an array.')
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new TypeError(label + ' cannot be sparse.')
  }
  return value
}

const identity = (value: unknown, label: string): string => {
  let candidate = value
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    candidate = (candidate as Row).id
  }
  if (
    (typeof candidate !== 'string' && typeof candidate !== 'number') ||
    (typeof candidate === 'number' && !Number.isSafeInteger(candidate))
  ) {
    throw new TypeError(label + ' has an unsupported identity shape.')
  }
  return String(candidate)
}

const sourceScalar = (value: unknown, label: string): SourceScalar => {
  if (value === null || value === undefined) return value
  if (
    typeof value === 'bigint' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) return value
  throw new TypeError(label + ' must be scalar source metadata.')
}

const pageResult = (value: unknown, requestedPage: number, label: string): Page => {
  const candidate = record(value, label + ' pagination result')
  const docs = denseArray(candidate.docs, label + ' page docs')
  const integer = (field: string, minimum: number): number => {
    const item = candidate[field]
    if (!Number.isSafeInteger(item) || (item as number) < minimum) {
      throw new TypeError(label + ' pagination has malformed ' + field + '.')
    }
    return item as number
  }
  const totalDocs = integer('totalDocs', 0)
  const totalPages = integer('totalPages', 1)
  const page = integer('page', 1)
  const limit = integer('limit', 1)
  const pagingCounter = integer('pagingCounter', 1)
  const expectedPages = Math.max(1, Math.ceil(totalDocs / PAGE_LIMIT))
  const expectedDocs = Math.min(PAGE_LIMIT, Math.max(0, totalDocs - ((requestedPage - 1) * PAGE_LIMIT)))
  const expectedHasNext = requestedPage < expectedPages
  const expectedHasPrev = requestedPage > 1
  if (
    page !== requestedPage ||
    limit !== PAGE_LIMIT ||
    totalPages !== expectedPages ||
    pagingCounter !== ((requestedPage - 1) * PAGE_LIMIT) + 1 ||
    candidate.hasNextPage !== expectedHasNext ||
    candidate.hasPrevPage !== expectedHasPrev ||
    candidate.nextPage !== (expectedHasNext ? requestedPage + 1 : null) ||
    candidate.prevPage !== (expectedHasPrev ? requestedPage - 1 : null) ||
    docs.length !== expectedDocs
  ) {
    throw new TypeError(label + ' pagination is inconsistent or truncated.')
  }
  return candidate as unknown as Page
}

const consumePages = async (
  label: string,
  findPage: (page: number) => Promise<unknown>,
  budget: RetainedBudget,
  consumeRow: (row: Row) => void,
): Promise<void> => {
  const rowIDs = new Set<string>()
  let declaredTotal: number | undefined
  let consumedRows = 0
  for (let page = 1; ; page += 1) {
    const result = pageResult(await findPage(page), page, label)
    if (result.totalDocs > MAX_REFERENCES) {
      throw new TypeError(label + ' exceeds the bounded 10,000 row source limit.')
    }
    declaredTotal ??= result.totalDocs
    if (result.totalDocs !== declaredTotal) {
      throw new TypeError(label + ' pagination total changed between pages.')
    }
    for (const value of result.docs) {
      const row = record(value, label + ' row')
      const id = identity(row.id, label + ' row')
      if (rowIDs.has(id)) throw new TypeError(label + ' pagination contains a duplicate row ID.')
      budget.normalizedBytes += Buffer.byteLength(id, 'utf8')
      if (budget.normalizedBytes > MAX_NORMALIZED_REFERENCE_BYTES) {
        throw new TypeError('Payload legacy media references exceed the 8 MiB normalized metadata limit.')
      }
      rowIDs.add(id)
      consumeRow(row)
      consumedRows += 1
    }
    if (!result.hasNextPage) break
  }
  if (consumedRows !== declaredTotal) {
    throw new TypeError(label + ' pagination did not return its declared total.')
  }
}

const state = (row: Row): LegacyMediaReference['state'] => {
  if (row.deletedAt !== undefined && row.deletedAt !== null) return 'trashed'
  if (row._status === 'draft') return 'draft'
  if (row._status === 'published') return 'published'
  return 'unknown'
}

const files = (row: Row): LegacyMediaReference['files'] => {
  const output: Array<Record<string, unknown>> = [{
    variant: 'original',
    ...(Object.hasOwn(row, 'filename')
      ? { filename: sourceScalar(row.filename, 'Media filename') }
      : {}),
    ...(Object.hasOwn(row, 'filesize')
      ? { expectedBytes: sourceScalar(row.filesize, 'Media filesize') }
      : {}),
  }]
  if (row.sizes !== undefined && row.sizes !== null) {
    const sizes = record(row.sizes, 'Media sizes')
    const variants = Object.keys(sizes).sort()
    if (variants.length > 15) throw new TypeError('Media sizes exceed the 16 variant limit.')
    for (const variant of variants) {
      const size = record(sizes[variant], 'Media size ' + variant)
      output.push({
        variant,
        ...(Object.hasOwn(size, 'filename')
          ? { filename: sourceScalar(size.filename, 'Media size filename') }
          : {}),
        ...(Object.hasOwn(size, 'filesize')
          ? { expectedBytes: sourceScalar(size.filesize, 'Media size filesize') }
          : {}),
      })
    }
  }
  return output as LegacyMediaReference['files']
}

const mediaReference = (
  kind: 'document' | 'draft',
  row: Row,
): LegacyMediaReference => {
  const documentId = identity(row.id, 'Media document')
  return {
    kind,
    documentId,
    referenceId: documentId,
    state: state(row),
    files: files(row),
    ...(Object.hasOwn(row, 'storageRevision')
      ? { storageRevision: sourceScalar(row.storageRevision, 'Media storage revision') as string }
      : {}),
  }
}

const versionReference = (row: Row): LegacyMediaReference => {
  const storedVersion = record(row.version, 'Media version')
  return {
    kind: 'version',
    documentId: identity(row.parent, 'Media version parent'),
    referenceId: identity(row.id, 'Media version'),
    state: state(storedVersion),
    files: files(storedVersion),
    ...(Object.hasOwn(storedVersion, 'storageRevision')
      ? { storageRevision: sourceScalar(storedVersion.storageRevision, 'Media version storage revision') as string }
      : {}),
  }
}

const assertSnapshotProvenance = (snapshot: Row, manifest: PreviewManifest): void => {
  if (
    manifest.schemaVersion !== 1 ||
    !manifest.source ||
    typeof manifest.source !== 'object' ||
    manifest.source.collection !== 'pages' ||
    typeof manifest.source.documentId !== 'string' ||
    typeof manifest.source.versionId !== 'string' ||
    snapshot.schemaVersion !== manifest.schemaVersion ||
    snapshot.sourceCollection !== manifest.source.collection ||
    String(snapshot.sourceDocumentId) !== manifest.source.documentId ||
    String(snapshot.sourceVersionId) !== manifest.source.versionId
  ) {
    throw new TypeError('Preview snapshot provenance does not match its manifest.')
  }
}

const snapshotReferences = (snapshot: Row): LegacyMediaReference[] => {
  const snapshotID = identity(snapshot.id, 'Preview snapshot')
  const manifest = record(snapshot.manifest, 'Preview snapshot manifest') as unknown as PreviewManifest
  const verifiedHash = hashPreviewManifest(manifest)
  if (snapshot.manifestHash !== verifiedHash) {
    throw new TypeError('Preview snapshot stored hash does not match its manifest.')
  }
  assertSnapshotProvenance(snapshot, manifest)
  const captured = denseArray(manifest.mediaReferences, 'Preview snapshot media references')
  const mediaIDs = new Set<string>()
  return captured.map((value) => {
    const media = record(value, 'Preview snapshot media reference')
    const mediaID = identity(media.id, 'Preview snapshot media reference')
    if (mediaIDs.has(mediaID)) throw new TypeError('Preview snapshot contains a duplicate media identity.')
    mediaIDs.add(mediaID)
    let storageRevision: unknown
    if (media.storage === 'versioned') {
      storageRevision = Object.hasOwn(media, 'storageRevision')
        ? sourceScalar(media.storageRevision, 'Preview snapshot storage revision')
        : null
    } else if (media.storage === 'legacy-unverified') {
      if (Object.hasOwn(media, 'storageRevision')) storageRevision = null
    } else {
      storageRevision = null
    }
    return {
      kind: 'snapshot',
      documentId: mediaID,
      referenceId: snapshotID,
      state: 'unknown',
      files: [{
        variant: 'original',
        ...(Object.hasOwn(media, 'filename')
          ? { filename: sourceScalar(media.filename, 'Preview snapshot filename') as string }
          : {}),
      }],
      ...(storageRevision === undefined ? {} : { storageRevision: storageRevision as string }),
    }
  })
}

const appendBounded = (
  target: LegacyMediaReference[],
  additions: readonly LegacyMediaReference[],
  budget: RetainedBudget,
): void => {
  if (target.length + additions.length > MAX_REFERENCES) {
    throw new TypeError('Payload legacy media references exceed the global 10,000 reference limit.')
  }
  let normalizedBytes = budget.normalizedBytes
  for (let index = 0; index < additions.length; index += 1) {
    const serialized = JSON.stringify(additions[index], (_key, value) =>
      typeof value === 'bigint' ? String(value) : value)
    normalizedBytes += Buffer.byteLength(serialized, 'utf8')
    if (target.length + index > 0) normalizedBytes += 1
    if (normalizedBytes > MAX_NORMALIZED_REFERENCE_BYTES) {
      throw new TypeError('Payload legacy media references exceed the 8 MiB normalized metadata limit.')
    }
  }
  budget.normalizedBytes = normalizedBytes
  target.push(...additions)
}

export async function inspectPayloadLegacyMedia(input: {
  payload: Payload
  req: PayloadRequest
  root: string
}): Promise<LegacyMediaInventory> {
  if (!isOwner(input?.req?.user)) throw new APIError('An owner session is required.', 403)
  if (input.req.transactionID !== undefined && input.req.transactionID !== null) {
    throw new APIError('Legacy media inventory requires a request without an active transaction.', 409)
  }

  const common = {
    depth: 0 as const,
    limit: PAGE_LIMIT,
    overrideAccess: false as const,
    pagination: true as const,
    req: input.req,
    sort: 'id' as const,
  }
  const references: LegacyMediaReference[] = []
  const referenceBudget = { normalizedBytes: 2 }
  await consumePages('Published media', (page) => input.payload.find({
    ...common, collection: 'media', draft: false, page, trash: true,
  }), referenceBudget, (row) => {
    if (row._status !== 'draft') {
      appendBounded(references, [mediaReference('document', row)], referenceBudget)
    }
  })
  await consumePages('Latest draft media', (page) => input.payload.find({
    ...common, collection: 'media', draft: true, page, trash: true,
  }), referenceBudget, (row) => {
    if (row._status === 'draft') {
      appendBounded(references, [mediaReference('draft', row)], referenceBudget)
    }
  })
  await consumePages('Media versions', (page) => input.payload.findVersions({
    ...common, collection: 'media', page, trash: true,
  }), referenceBudget, (row) => appendBounded(references, [versionReference(row)], referenceBudget))
  await consumePages('Preview snapshots', (page) => input.payload.find({
    ...common, collection: 'preview-snapshots', page,
  }), referenceBudget, (row) => appendBounded(references, snapshotReferences(row), referenceBudget))

  return inspectLegacyMediaInventory({ root: input.root, references })
}
