import { createHash } from 'node:crypto'
import type { BigIntStats } from 'node:fs'
import { lstat, open, readdir, realpath } from 'node:fs/promises'
import { isAbsolute, join, parse, posix, resolve, win32 } from 'node:path'

const MAX_REFERENCES = 10_000
const MAX_VARIANTS = 16
const MAX_PHYSICAL_ENTRIES = 10_000
const MAX_FILE_BYTES = 64 * 1024 * 1024
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024
const MAX_REPORT_BYTES = 8 * 1024 * 1024
const MAX_IDENTIFIER_CHARS = 256
const MAX_FILENAME_BYTES = 255
const MANIFEST_NAME = 'manifest.json'
const CONTROL_CHARACTER = /\p{Cc}/u
const UNSAFE_FILENAME_CHARACTER = /[\\/:]/u
const WINDOWS_DEVICE_NAME = /^(?:aux|con|nul|prn|com[1-9]|lpt[1-9])(?:\.|$)/iu
const REVISION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u

export type LegacyMediaReference = {
  kind: 'document' | 'draft' | 'version' | 'snapshot'
  documentId: string
  referenceId: string
  state: 'published' | 'draft' | 'trashed' | 'unknown'
  storageRevision?: string
  files: { variant: string; filename?: string; expectedBytes?: number }[]
}

export type LegacyFileObservation = {
  filename: string
  status: 'present' | 'unsafe-entry'
  bytes?: number
  sha256?: string
}

export type LegacyReferenceObservation = LegacyMediaReference & {
  status: 'current-observed' | 'historical-unverified' | 'versioned-not-inspected' | 'incomplete'
  issues: string[]
  observedFiles: LegacyFileObservation[]
}

export type LegacyMediaInventory = {
  schemaVersion: 1
  migrationReady: false
  references: LegacyReferenceObservation[]
  physicalFiles: LegacyFileObservation[]
  unreferencedFiles: string[]
  issues: string[]
  totalObservedBytes: number
  hash: string
}

type PreparedReference = {
  reference: LegacyMediaReference
  issues: string[]
  hasValidRevision: boolean
}

type PhysicalEntry = {
  name: string
  canonicalName: string
  path: string
  before?: BigIntStats
  observation: LegacyFileObservation
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0

const sortUnique = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareText)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isWellFormedUtf16 = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      if (index + 1 >= value.length) return false
      const next = value.charCodeAt(index + 1)
      if (next < 0xdc00 || next > 0xdfff) return false
      index += 1
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false
    }
  }
  return true
}

const looksLikeAbsolutePathOrUrl = (value: string): boolean =>
  isAbsolute(value) ||
  posix.isAbsolute(value) ||
  win32.isAbsolute(value) ||
  /^[a-z][a-z0-9+.-]*:/iu.test(value)

const isBoundedIdentifier = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  Array.from(value).length <= MAX_IDENTIFIER_CHARS &&
  value.trim().length > 0 &&
  isWellFormedUtf16(value) &&
  !CONTROL_CHARACTER.test(value) &&
  !looksLikeAbsolutePathOrUrl(value)

const isSafeFilename = (value: string): boolean =>
  value.length > 0 &&
  isWellFormedUtf16(value) &&
  Buffer.byteLength(value, 'utf8') <= MAX_FILENAME_BYTES &&
  value !== '.' &&
  value !== '..' &&
  !CONTROL_CHARACTER.test(value) &&
  !UNSAFE_FILENAME_CHARACTER.test(value) &&
  !/[. ]$/u.test(value) &&
  !WINDOWS_DEVICE_NAME.test(value) &&
  value.toLowerCase() !== MANIFEST_NAME

const canonicalFilename = (value: string): string => value.normalize('NFC').toLowerCase()

const reportSafeFilename = (value: string): string =>
  looksLikeAbsolutePathOrUrl(value)
    ? 'unsafe-name-' + createHash('sha256').update(value).digest('hex')
    : value

const samePath = (left: string, right: string): boolean =>
  process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right

const cloneObservation = (value: LegacyFileObservation): LegacyFileObservation =>
  value.status === 'present'
    ? { filename: value.filename, status: 'present', bytes: value.bytes, sha256: value.sha256 }
    : { filename: value.filename, status: 'unsafe-entry' }

const validateReferences = (value: unknown): PreparedReference[] => {
  if (!Array.isArray(value) || value.length > MAX_REFERENCES) {
    throw new Error('Legacy media references must be a bounded array.')
  }
  const identities = new Set<string>()
  return value.map((candidate) => {
    if (!isRecord(candidate)) throw new Error('Each legacy media reference must be an object.')
    if (
      candidate.kind !== 'document' &&
      candidate.kind !== 'draft' &&
      candidate.kind !== 'version' &&
      candidate.kind !== 'snapshot'
    ) {
      throw new Error('A legacy media reference has an invalid kind.')
    }
    if (
      candidate.state !== 'published' &&
      candidate.state !== 'draft' &&
      candidate.state !== 'trashed' &&
      candidate.state !== 'unknown'
    ) {
      throw new Error('A legacy media reference has an invalid state.')
    }
    if (!isBoundedIdentifier(candidate.documentId) || !isBoundedIdentifier(candidate.referenceId)) {
      throw new Error('Legacy media reference identifiers are invalid.')
    }
    if (!Array.isArray(candidate.files) || candidate.files.length > MAX_VARIANTS) {
      throw new Error('Legacy media variants must be a bounded array.')
    }
    const identity = [candidate.kind, candidate.documentId, candidate.referenceId].join('\u0000')
    if (identities.has(identity)) {
      throw new Error('Legacy media reference identities must be unique.')
    }
    identities.add(identity)

    const issues: string[] = []
    const variants = new Set<string>()
    const files = candidate.files.map((fileCandidate) => {
      if (!isRecord(fileCandidate) || !isBoundedIdentifier(fileCandidate.variant)) {
        throw new Error('A legacy media variant has an invalid name.')
      }
      if (variants.has(fileCandidate.variant)) {
        throw new Error('Legacy media variants must be unique within a reference.')
      }
      variants.add(fileCandidate.variant)
      const file: LegacyMediaReference['files'][number] = { variant: fileCandidate.variant }
      if (fileCandidate.filename === undefined) {
        issues.push('incomplete-metadata:' + file.variant + ':filename')
      } else if (typeof fileCandidate.filename !== 'string') {
        issues.push('invalid-filename-metadata:' + file.variant)
      } else if (looksLikeAbsolutePathOrUrl(fileCandidate.filename)) {
        issues.push('unsafe-filename:' + file.variant)
      } else {
        file.filename = fileCandidate.filename
      }
      if (fileCandidate.expectedBytes !== undefined) {
        if (
          !Number.isSafeInteger(fileCandidate.expectedBytes) ||
          (fileCandidate.expectedBytes as number) <= 0
        ) {
          issues.push('invalid-expected-bytes:' + file.variant)
        } else {
          file.expectedBytes = fileCandidate.expectedBytes as number
        }
      }
      return file
    }).sort((left, right) =>
      compareText(left.variant, right.variant) ||
      compareText(left.filename ?? '', right.filename ?? '')
    )

    let storageRevision: string | undefined
    let hasValidRevision = false
    if (candidate.storageRevision !== undefined) {
      if (typeof candidate.storageRevision === 'string') {
        hasValidRevision = REVISION_ID.test(candidate.storageRevision)
        if (hasValidRevision) storageRevision = candidate.storageRevision
      }
      if (!hasValidRevision) issues.push('invalid-storage-revision')
    }
    const reference: LegacyMediaReference = {
      kind: candidate.kind,
      documentId: candidate.documentId,
      referenceId: candidate.referenceId,
      state: candidate.state,
      files,
    }
    if (storageRevision !== undefined) reference.storageRevision = storageRevision
    return { reference, issues: sortUnique(issues), hasValidRevision }
  })
}

const validateRoot = async (root: unknown): Promise<string> => {
  if (typeof root !== 'string' || !isAbsolute(root)) {
    throw new Error('The legacy media root must be an absolute path.')
  }
  const resolved = resolve(root)
  if (samePath(resolved, parse(resolved).root)) {
    throw new Error('The legacy media root cannot be a filesystem root.')
  }
  const stats = await lstat(resolved)
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error('The legacy media root must be a physical directory.')
  }
  const physical = await realpath(resolved)
  if (!samePath(physical, resolved)) {
    throw new Error('The legacy media root cannot traverse links.')
  }
  return physical
}

const sameFileSnapshot = (left: BigIntStats, right: BigIntStats): boolean =>
  left.isFile() &&
  right.isFile() &&
  left.nlink === 1n &&
  right.nlink === 1n &&
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs

const hashPhysicalFile = async (entry: PhysicalEntry): Promise<LegacyFileObservation> => {
  if (!entry.before) throw new Error('Cannot hash an unsafe physical entry.')
  const handle = await open(entry.path, 'r')
  try {
    const opened = await handle.stat({ bigint: true })
    if (!sameFileSnapshot(entry.before, opened)) {
      throw new Error('A legacy media file changed before streaming.')
    }
    const digest = createHash('sha256')
    let bytes = 0
    const stream = handle.createReadStream({ autoClose: false })
    for await (const chunk of stream) {
      digest.update(chunk)
      bytes += chunk.length
    }
    const openedAfter = await handle.stat({ bigint: true })
    const pathAfter = await lstat(entry.path, { bigint: true })
    if (
      !sameFileSnapshot(opened, openedAfter) ||
      !sameFileSnapshot(opened, pathAfter) ||
      BigInt(bytes) !== opened.size
    ) {
      throw new Error('A legacy media file changed during streaming.')
    }
    return {
      filename: entry.name,
      status: 'present',
      bytes,
      sha256: digest.digest('hex'),
    }
  } finally {
    await handle.close()
  }
}

const scanPhysicalEntries = async (
  root: string,
): Promise<{ entries: PhysicalEntry[]; issues: string[]; totalObservedBytes: number }> => {
  const names = (await readdir(root, { withFileTypes: true }))
    .map(({ name }) => name)
    .sort(compareText)
  if (names.length > MAX_PHYSICAL_ENTRIES) {
    throw new Error('The legacy media root exceeds the physical entry limit.')
  }
  const entries: PhysicalEntry[] = []
  const issues: string[] = []
  let totalObservedBytes = 0
  for (const name of names) {
    const path = join(root, name)
    const before = await lstat(path, { bigint: true })
    const canonicalName = canonicalFilename(name)
    const reportName = reportSafeFilename(name)
    let safe = isSafeFilename(name) && before.isFile() && !before.isSymbolicLink() && before.nlink === 1n
    if (safe) safe = samePath(await realpath(path), resolve(path))
    if (!safe) {
      entries.push({
        name,
        canonicalName,
        path,
        observation: { filename: reportName, status: 'unsafe-entry' },
      })
      issues.push('unsafe-physical-entry:' + reportName)
      continue
    }
    if (before.size > BigInt(MAX_FILE_BYTES)) {
      throw new Error('A legacy media file exceeds the 64 MiB limit.')
    }
    totalObservedBytes += Number(before.size)
    if (totalObservedBytes > MAX_TOTAL_BYTES) {
      throw new Error('The legacy media root exceeds the 1 GiB byte limit.')
    }
    entries.push({
      name,
      canonicalName,
      path,
      before,
      observation: { filename: name, status: 'present' },
    })
  }
  const byCanonical = new Map<string, PhysicalEntry[]>()
  for (const entry of entries) {
    const group = byCanonical.get(entry.canonicalName) ?? []
    group.push(entry)
    byCanonical.set(entry.canonicalName, group)
  }
  for (const [canonicalName, group] of byCanonical) {
    if (group.length > 1) {
      issues.push('physical-name-collision:' + reportSafeFilename(canonicalName))
    }
  }
  for (const entry of entries) {
    if (entry.before) entry.observation = await hashPhysicalFile(entry)
  }
  return { entries, issues: sortUnique(issues), totalObservedBytes }
}

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value)
    if (encoded === undefined) throw new Error('The report contains a non-serializable value.')
    return encoded
  }
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  return '{' + Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => compareText(left, right))
    .map(([key, item]) => JSON.stringify(key) + ':' + stableJson(item))
    .join(',') + '}'
}

export async function inspectLegacyMediaInventory(input: {
  root: string
  references: readonly LegacyMediaReference[]
}): Promise<LegacyMediaInventory> {
  const prepared = validateReferences(input?.references)
  const root = await validateRoot(input?.root)
  const physical = await scanPhysicalEntries(root)
  const physicalByCanonical = new Map<string, PhysicalEntry[]>()
  for (const entry of physical.entries) {
    const group = physicalByCanonical.get(entry.canonicalName) ?? []
    group.push(entry)
    physicalByCanonical.set(entry.canonicalName, group)
  }

  const reportIssues = [...physical.issues]
  const documentsByFilename = new Map<string, Set<string>>()
  for (const item of prepared) {
    if (item.hasValidRevision) continue
    for (const file of item.reference.files) {
      if (!file.filename || !isSafeFilename(file.filename)) continue
      const canonicalName = canonicalFilename(file.filename)
      const documents = documentsByFilename.get(canonicalName) ?? new Set<string>()
      documents.add(item.reference.documentId)
      documentsByFilename.set(canonicalName, documents)
    }
  }
  for (const [canonicalName, documents] of documentsByFilename) {
    if (documents.size > 1) reportIssues.push('shared-filename:' + canonicalName)
  }

  const referencedCanonicalNames = new Set<string>()
  const referencedUnsafeNames = new Set<string>()
  const references = prepared.map((item): LegacyReferenceObservation => {
    const issues = [...item.issues]
    const observedFiles: LegacyFileObservation[] = []
    if (!item.hasValidRevision) {
      for (const file of item.reference.files) {
        if (!file.filename) continue
        if (!isSafeFilename(file.filename)) {
          issues.push('unsafe-filename:' + file.variant)
          referencedUnsafeNames.add(file.filename)
          observedFiles.push({ filename: file.filename, status: 'unsafe-entry' })
          continue
        }
        const canonicalName = canonicalFilename(file.filename)
        referencedCanonicalNames.add(canonicalName)
        const candidates = physicalByCanonical.get(canonicalName) ?? []
        if (candidates.length === 0) {
          issues.push('missing-file:' + file.variant)
          continue
        }
        if (candidates.length > 1) {
          issues.push('ambiguous-file:' + file.variant)
          observedFiles.push(...candidates.map(({ observation }) => cloneObservation(observation)))
          continue
        }
        const observed = cloneObservation(candidates[0].observation)
        observedFiles.push(observed)
        if (observed.status === 'unsafe-entry') {
          issues.push('unsafe-entry:' + file.variant)
          continue
        }
        if (observed.bytes === 0) issues.push('empty-file:' + file.variant)
        if (file.expectedBytes !== undefined && observed.bytes !== file.expectedBytes) {
          issues.push('size-mismatch:' + file.variant)
        }
      }
    }
    const sortedIssues = sortUnique(issues)
    const status: LegacyReferenceObservation['status'] = item.hasValidRevision
      ? 'versioned-not-inspected'
      : sortedIssues.length > 0
        ? 'incomplete'
        : item.reference.kind === 'version' || item.reference.kind === 'snapshot'
          ? 'historical-unverified'
          : 'current-observed'
    return {
      kind: item.reference.kind,
      documentId: item.reference.documentId,
      referenceId: item.reference.referenceId,
      state: item.reference.state,
      ...(item.reference.storageRevision === undefined ? {} : {
        storageRevision: item.reference.storageRevision,
      }),
      files: item.reference.files.map((file) => ({
        variant: file.variant,
        ...(file.filename === undefined ? {} : { filename: file.filename }),
        ...(file.expectedBytes === undefined ? {} : { expectedBytes: file.expectedBytes }),
      })),
      status,
      issues: sortedIssues,
      observedFiles: observedFiles.sort((left, right) =>
        compareText(left.filename, right.filename) || compareText(left.status, right.status)
      ),
    }
  }).sort((left, right) =>
    compareText(left.kind, right.kind) ||
    compareText(left.documentId, right.documentId) ||
    compareText(left.referenceId, right.referenceId)
  )

  const physicalFiles = physical.entries
    .map(({ observation }) => cloneObservation(observation))
    .sort((left, right) => compareText(left.filename, right.filename))
  const unreferencedFiles = physical.entries
    .filter((entry) =>
      !referencedCanonicalNames.has(entry.canonicalName) &&
      !referencedUnsafeNames.has(entry.name)
    )
    .map(({ observation }) => observation.filename)
    .sort(compareText)
  const withoutHash: Omit<LegacyMediaInventory, 'hash'> = {
    schemaVersion: 1,
    migrationReady: false,
    references,
    physicalFiles,
    unreferencedFiles,
    issues: sortUnique(reportIssues),
    totalObservedBytes: physical.totalObservedBytes,
  }
  const hash = createHash('sha256').update(stableJson(withoutHash)).digest('hex')
  const report: LegacyMediaInventory = { ...withoutHash, hash }
  if (Buffer.byteLength(JSON.stringify(report), 'utf8') > MAX_REPORT_BYTES) {
    throw new Error('The serialized legacy media report exceeds 8 MiB.')
  }
  return report
}
