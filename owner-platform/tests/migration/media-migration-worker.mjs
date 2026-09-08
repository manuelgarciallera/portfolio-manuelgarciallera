import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, unlink } from 'node:fs/promises'
import path from 'node:path'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig, createLocalReq, getPayload } from 'payload'
import sharp from 'sharp'

import { Users } from '../../src/collections/Users.ts'
import { createPagePreviewSnapshot } from '../../src/preview/service.ts'
import { readMediaRevision, writeMediaRevision } from '../../src/media/revision-store.ts'
import { inspectPayloadLegacyMedia } from '../../src/media/legacy-media-inventory-service.ts'
import { createMigrationPlan } from '../../src/media/migration-plan.ts'
import { bindMigrationPlanInventory } from '../../src/media/migration-plan-inventory.ts'
import { verifyMigrationPlanFiles } from '../../src/media/migration-plan-physical.ts'
import { startMediaHTTPFixture } from '../media/http-fixture.ts'
import { snapshotFiles } from '../recovery/backup-manifest.mjs'
import {
  legacyMedia,
  migrationFixtureCollections,
  preparedFixtureCollections,
  preparedMedia,
} from './fixture-collections.ts'
import { assertLiveAdapterSession, runDedicatedAdapterTransaction } from './transaction.ts'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const clone = (value) => JSON.parse(JSON.stringify(value))
const specification = {
  A: { width: 1920, height: 1200, color: '#ff0000' },
  B: { width: 1920, height: 1440, color: '#0000ff' },
  C: { width: 1920, height: 1080, color: '#00ff00' },
}
const image = (label) => sharp({ create: {
  width: specification[label].width,
  height: specification[label].height,
  channels: 3,
  background: specification[label].color,
} }).png().toBuffer()

const progress = (message) => process.send?.({ progress: `migration:${message}` })
const filenamesFor = (doc) => [...new Set([
  doc.filename,
  ...Object.values(doc.sizes ?? {}).map((entry) => entry?.filename),
].filter((value) => typeof value === 'string'))].sort((left, right) => left.localeCompare(right, 'en'))
const filesFrom = async (directory, filenames) => Promise.all(filenames.map(async (name) => ({ name, bytes: await readFile(path.join(directory, name)) })))
const evidence = (files) => files.map(({ name, bytes }) => ({ name, sha256: sha256(bytes), size: bytes.length }))
  .sort((left, right) => left.name.localeCompare(right.name, 'en'))
const stripStorageRevision = (value) => {
  if (Array.isArray(value)) return value.map(stripStorageRevision)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'storageRevision')
    .map(([key, entry]) => [key, stripStorageRevision(entry)]))
}

const openPayload = async ({ databaseDirectory, mediaDirectory, payloadSecret, postgres, prepared, push }) => {
  const staticDir = path.join(mediaDirectory, 'legacy')
  await mkdir(staticDir, { recursive: true })
  if (!postgres) await mkdir(databaseDirectory, { recursive: true })
  const database = postgres
    ? postgresAdapter({ pool: postgres, push, disableCreateDatabase: true, schemaName: 'versioned_media_http_fixture' })
    : sqliteAdapter({ client: { url: `file:${path.join(databaseDirectory, 'owner.db').replaceAll('\\', '/')}` }, push, transactionOptions: {} })
  const config = await buildConfig({
    collections: [
      Users,
      prepared ? preparedMedia(staticDir) : legacyMedia(staticDir),
      ...(prepared ? preparedFixtureCollections : migrationFixtureCollections),
    ],
    db: database,
    graphQL: { disable: true },
    secret: payloadSecret,
    sharp,
  })
  return getPayload({ config, key: `media-migration-${randomUUID()}` })
}

const closePayload = async (payload) => {
  const database = payload.db
  await payload.destroy()
  if (database?.name === 'sqlite') database.client?.close?.()
}

const ownerFor = async (payload, credentials, create) => {
  if (create) await payload.create({ collection: 'users', overrideAccess: true, data: { ...credentials, role: 'owner' } })
  const login = await payload.login({ collection: 'users', data: credentials })
  assert.equal(typeof login.token, 'string')
  const session = await payload.auth({ headers: new Headers({ Authorization: `JWT ${login.token}` }) })
  assert.equal(session.user?.role, 'owner')
  return session.user
}

const versionsFor = async (payload, owner, mediaId) => {
  const result = await payload.findVersions({
    collection: 'media',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    user: owner,
    where: { parent: { equals: mediaId } },
  })
  assert.equal(result.docs.length, result.totalDocs)
  return result.docs.sort((left, right) => String(left.id).localeCompare(String(right.id), 'en', { numeric: true }))
}

const rowsFor = async (payload, mediaId) => {
  const current = await payload.db.findOne({ collection: 'media', where: { id: { equals: mediaId } } })
  const versions = await payload.db.findVersions({ collection: 'media', limit: 100, where: { parent: { equals: mediaId } } })
  const resolutions = payload.collections['media-migration-resolutions']
    ? await payload.db.find({ collection: 'media-migration-resolutions', limit: 100 })
    : { docs: [] }
  return clone({
    current,
    versions: versions.docs.sort((left, right) => String(left.id).localeCompare(String(right.id), 'en', { numeric: true })),
    resolutions: resolutions.docs.sort((left, right) => String(left.id).localeCompare(String(right.id), 'en', { numeric: true })),
  })
}

const createFrozenSnapshot = async (payload, owner, media) => {
  const brand = await payload.create({ collection: 'brand-profiles', user: owner, overrideAccess: false, data: {
    colors: [
      { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
    ],
    usageWeights: [
      { role: 'background', weight: 70 }, { role: 'surface', weight: 20 },
      { role: 'text', weight: 8 }, { role: 'accent', weight: 2 },
    ],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } })
  const page = await payload.create({ collection: 'pages', draft: true, user: owner, overrideAccess: false, data: {
    title: 'Synthetic frozen A', brandProfile: brand.id, layout: [{ blockType: 'hero', image: media.id }],
  } })
  const snapshot = await createPagePreviewSnapshot({
    payload,
    req: await createLocalReq({ user: owner }, payload),
    pageId: page.id,
  })
  assert.deepEqual(snapshot.manifest.mediaReferences, [{
    id: String(media.id), alt: 'Synthetic A', filename: media.filename, mimeType: 'image/png',
    width: 1920, height: 1200, storage: 'legacy-unverified',
  }])
  return clone(await payload.findByID({
    collection: 'preview-snapshots', id: snapshot.id, depth: 0, overrideAccess: false, user: owner,
  }))
}

const seedLegacy = async (input) => {
  const payload = await openPayload({ ...input, prepared: false, push: true })
  try {
    const owner = await ownerFor(payload, input.credentials, true)
    const bytesA = await image('A')
    const mediaA = await payload.create({
      collection: 'media', draft: false, overrideAccess: false, user: owner, depth: 0,
      data: { alt: 'Synthetic A', caption: 'Migration QA A', _status: 'published' },
      file: { name: 'synthetic-migration.png', data: bytesA, mimetype: 'image/png', size: bytesA.length },
    })
    assert.deepEqual([mediaA.width, mediaA.height], [1920, 1200])
    const staticDir = path.join(input.mediaDirectory, 'legacy')
    const aNames = filenamesFor(mediaA)
    assert.equal(aNames.length, 4)
    const authenticA = await filesFrom(staticDir, aNames)
    const archiveA = path.join(input.mediaDirectory, 'authentic-a')
    await mkdir(archiveA)
    for (const file of authenticA) await copyFile(path.join(staticDir, file.name), path.join(archiveA, file.name))
    const aEvidence = evidence(authenticA)
    const capturedBefore = await createFrozenSnapshot(payload, owner, mediaA)

    const bytesB = await image('B')
    const mediaB = await payload.update({
      collection: 'media', id: mediaA.id, draft: false, overrideAccess: false, user: owner, depth: 0,
      overwriteExistingFiles: true,
      data: { alt: 'Synthetic B', caption: 'Migration QA B', _status: 'published' },
      file: { name: 'synthetic-migration.png', data: bytesB, mimetype: 'image/png', size: bytesB.length },
    })
    assert.deepEqual([mediaB.width, mediaB.height], [1920, 1440])
    assert.equal(mediaB.filename, mediaA.filename, 'B must overwrite the exact legacy filename.')
    const authenticB = await filesFrom(staticDir, filenamesFor(mediaB))
    assert.equal(authenticB.length, 4)
    const bOriginal = authenticB.find(({ name }) => name === mediaB.filename)
    const aOriginal = authenticA.find(({ name }) => name === mediaA.filename)
    assert(bOriginal && aOriginal)
    assert.notEqual(sha256(bOriginal.bytes), sha256(aOriginal.bytes))
    assert.deepEqual([...(await sharp(bOriginal.bytes).raw().toBuffer()).subarray(0, 3)], [0, 0, 255])
    const archiveB = path.join(input.mediaDirectory, 'authentic-b')
    await mkdir(archiveB)
    for (const file of authenticB) await copyFile(path.join(staticDir, file.name), path.join(archiveB, file.name))
    const allVersions = await versionsFor(payload, owner, mediaA.id)
    const versionA = allVersions.find((entry) => entry.version.alt === 'Synthetic A')
    assert(versionA, 'Legacy A version must exist before migration.')
    const rowsBefore = stripStorageRevision(await rowsFor(payload, mediaA.id))
    return {
      mediaId: mediaA.id,
      filename: mediaA.filename,
      versionA: versionA.id,
      capturedBefore,
      rowsBefore,
      revisions: { A: { files: aEvidence }, B: { files: evidence(authenticB) } },
      fileCounts: { A: authenticA.length, B: authenticB.length },
    }
  } finally {
    await closePayload(payload)
  }
}

const assertAuthenticRevision = async (root, revision, expected) => {
  const files = await readMediaRevision(root, revision)
  assert.deepEqual(evidence(files), expected.files)
  return files
}

const patchAllRows = async ({ payload, req, expected, revisions, write, injectFailure }) => {
  const rows = await rowsFor(payload, expected.mediaId)
  const currentPatch = { ...rows.current, storageRevision: revisions.B }
  await write(() => payload.db.updateOne({
    collection: 'media', id: expected.mediaId, data: currentPatch, req, returning: false,
  }))
  const versionRows = rows.versions
  for (const row of versionRows) {
    const revision = row.version.alt === 'Synthetic A' ? revisions.A
      : row.version.alt === 'Synthetic B' ? revisions.B : undefined
    assert(revision, `Unexpected legacy media version ${row.id}.`)
    const { id, ...versionData } = row
    await write(() => payload.db.updateVersion({
      collection: 'media', id, req, returning: false,
      versionData: { ...versionData, version: { ...versionData.version, storageRevision: revision } },
    }))
    if (injectFailure) break
  }
  await write(() => payload.create({
    collection: 'media-migration-resolutions', overrideAccess: true, req,
    data: {
      snapshotId: String(expected.capturedBefore.id),
      manifestHash: expected.capturedBefore.manifestHash,
      mediaId: String(expected.mediaId),
      filename: expected.filename,
      storageRevision: revisions.A,
    },
  }))
  if (injectFailure) throw new Error('Injected migration failure after partial row and resolution patches.')
}

const migratePrepared = async (input) => {
  const revisionRoot = path.join(input.mediaDirectory, 'revisions')
  await mkdir(revisionRoot, { recursive: true })
  const payload = await openPayload({ ...input, prepared: true, push: true })
  try {
    const owner = await ownerFor(payload, input.credentials, false)
    const rowsPrepared = await rowsFor(payload, input.expected.mediaId)
    assert.deepEqual(stripStorageRevision(rowsPrepared), input.expected.rowsBefore)
    const capturedBefore = input.expected.capturedBefore
    const capturedAfter = clone(await payload.findByID({
      collection: 'preview-snapshots', id: capturedBefore.id, depth: 0, overrideAccess: false, user: owner,
    }))
    assert.deepEqual(capturedAfter, capturedBefore)

    const rowsBeforeMissingRestore = await rowsFor(payload, input.expected.mediaId)
    const filesBeforeMissingRestore = await snapshotFiles(input.mediaDirectory)
    const missingRestoreReq = await createLocalReq({ user: owner }, payload)
    await assert.rejects(runDedicatedAdapterTransaction({
      db: payload.db,
      req: missingRestoreReq,
      execute: async ({ write }) => {
        const restored = await write(() => payload.restoreVersion({
          collection: 'media', id: input.expected.versionA, req: missingRestoreReq,
          depth: 0, overrideAccess: false, user: owner,
        }))
        assert.equal(restored.alt, 'Synthetic A', 'Payload restored the legacy A metadata envelope.')
        let bytes
        try {
          bytes = await readFile(path.join(input.mediaDirectory, 'legacy', restored.filename))
        } catch (error) {
          if (error?.code === 'ENOENT') {
            throw new Error('Historical revision bytes are missing before migration; restored A metadata has no file.')
          }
          throw error
        }
        const pixels = await sharp(bytes).raw().toBuffer()
        if ([...pixels.subarray(0, 3)].every((value, index) => value === [255, 0, 0][index])) {
          throw new Error('Legacy restore unexpectedly recovered authentic A bytes without a stored revision.')
        }
        throw new Error('Historical revision bytes are missing before migration; restored A metadata still resolves to B bytes.')
      },
    }), /historical revision bytes are missing/i)
    assert.deepEqual(await rowsFor(payload, input.expected.mediaId), rowsBeforeMissingRestore)
    const staticDir = path.join(input.mediaDirectory, 'legacy')
    for (const entry of await readdir(staticDir, { withFileTypes: true })) {
      assert(entry.isFile() && !entry.isSymbolicLink(), 'Legacy QA storage contains an unexpected entry.')
      await unlink(path.join(staticDir, entry.name))
    }
    for (const file of input.expected.revisions.B.files) {
      await copyFile(path.join(input.mediaDirectory, 'authentic-b', file.name), path.join(staticDir, file.name))
    }
    assert.deepEqual(await snapshotFiles(input.mediaDirectory), filesBeforeMissingRestore)

    const authenticA = await filesFrom(
      path.join(input.mediaDirectory, 'authentic-a'),
      input.expected.revisions.A.files.map(({ name }) => name),
    )
    const authenticB = await filesFrom(
      path.join(input.mediaDirectory, 'authentic-b'),
      input.expected.revisions.B.files.map(({ name }) => name),
    )
    assert.deepEqual(evidence(authenticA), input.expected.revisions.A.files)
    assert.deepEqual(evidence(authenticB), input.expected.revisions.B.files)
    const revisions = {
      A: await writeMediaRevision(revisionRoot, authenticA),
      B: await writeMediaRevision(revisionRoot, authenticB),
    }
    assert.notEqual(revisions.A, revisions.B)
    await assertAuthenticRevision(revisionRoot, revisions.A, input.expected.revisions.A)
    await assertAuthenticRevision(revisionRoot, revisions.B, input.expected.revisions.B)
    const revisionFilesBeforeTransactions = await snapshotFiles(revisionRoot)
    const rowsBefore = await rowsFor(payload, input.expected.mediaId)

    // QA-only source of trust: this isolated fixture is the sole writer and
    // retained authentic A/B bytes before replacement. This is not a general
    // resolver of historical evidence, a production freeze or a cutover permit.
    const inventoryReq = await createLocalReq({ user: owner }, payload)
    const inventory = await inspectPayloadLegacyMedia({ payload, req: inventoryReq, root: staticDir })
    const candidate = createMigrationPlan({
      sourceInventoryHash: inventory.hash,
      references: inventory.references.map(({ kind, documentId, referenceId, files }) => ({
        kind, documentId, referenceId, variants: files.map(({ variant }) => variant),
      })),
      evidence: inventory.references.flatMap((reference) => {
        assert.equal(reference.documentId, String(input.expected.mediaId))
        let label
        if (reference.kind === 'document') label = 'B'
        else if (reference.kind === 'version') {
          const version = rowsBefore.versions.find(row => String(row.id) === reference.referenceId)
          assert(version, 'QA candidate contains an unknown historical version.')
          label = version.version.alt === 'Synthetic A' ? 'A'
            : version.version.alt === 'Synthetic B' ? 'B' : undefined
        } else if (reference.kind === 'snapshot') {
          assert.equal(reference.referenceId, String(capturedBefore.id))
          label = 'A'
        }
        assert(label, 'QA candidate contains a reference outside this fixture.')
        const authentic = input.expected.revisions[label]
        return reference.files.map(({ variant, filename }) => {
          const archived = authentic.files.find(file => file.name === filename)
          assert(archived, 'QA reference has no authentic archived file.')
          return { kind: reference.kind, documentId: reference.documentId, referenceId: reference.referenceId,
            variant, filename, bytes: archived.size, sha256: archived.sha256, revision: revisions[label],
            evidenceHash: sha256(Buffer.from(JSON.stringify(authentic.files))) }
        })
      }),
    })
    const serializedCandidate = JSON.stringify(candidate)
    const serializedInventory = JSON.stringify(inventory)
    const coverage = bindMigrationPlanInventory(serializedCandidate, serializedInventory, inventory.hash)
    const physical = await verifyMigrationPlanFiles(serializedCandidate, revisionRoot)
    assert.equal(coverage.canApply, false)
    assert.equal(physical.canApply, false)
    assert.equal(coverage.planDigest, physical.planDigest)

    const withoutSnapshot = createMigrationPlan({
      sourceInventoryHash: inventory.hash,
      references: candidate.references.filter(reference => reference.kind !== 'snapshot'),
      evidence: candidate.evidence.filter(entry => entry.kind !== 'snapshot'),
    })
    assert.throws(() => bindMigrationPlanInventory(JSON.stringify(withoutSnapshot), serializedInventory, inventory.hash),
      { code: 'inventory-coverage-mismatch' })
    assert.throws(() => bindMigrationPlanInventory(serializedCandidate, serializedInventory, '0'.repeat(64)),
      { code: 'inventory-integrity-mismatch' })
    const wrongBytes = createMigrationPlan({
      sourceInventoryHash: inventory.hash,
      references: candidate.references,
      evidence: candidate.evidence.map(entry => entry.revision === revisions.A
        ? { ...entry, sha256: '0'.repeat(64) } : entry),
    })
    // Correct coverage is insufficient: physically wrong historical bytes must fail.
    bindMigrationPlanInventory(JSON.stringify(wrongBytes), serializedInventory, inventory.hash)
    await assert.rejects(verifyMigrationPlanFiles(JSON.stringify(wrongBytes), revisionRoot),
      { code: 'candidate-file-mismatch' })
    assert.deepEqual(await rowsFor(payload, input.expected.mediaId), rowsBefore)
    assert.deepEqual(await snapshotFiles(revisionRoot), revisionFilesBeforeTransactions)
    const inventoryAgain = await inspectPayloadLegacyMedia({ payload, req: inventoryReq, root: staticDir })
    assert.equal(inventoryAgain.hash, inventory.hash, 'Source inventory changed before the QA transaction.')
    bindMigrationPlanInventory(serializedCandidate, JSON.stringify(inventoryAgain), inventory.hash)
    const candidateProof = { references: coverage.referenceCount, variants: coverage.variantCount,
      physicalFiles: physical.fileCount, omittedSnapshotRejected: true, staleInventoryRejected: true,
      wrongBytesRejected: true, canApply: false }

    const failedReq = await createLocalReq({ user: owner }, payload)
    await assert.rejects(runDedicatedAdapterTransaction({
      db: payload.db,
      req: failedReq,
      execute: ({ write }) => patchAllRows({
        payload, req: failedReq, expected: input.expected, revisions, write, injectFailure: true,
      }),
    }), /injected migration failure/i)
    const rowsAfterInjectedFailure = await rowsFor(payload, input.expected.mediaId)
    assert.deepEqual(rowsAfterInjectedFailure, rowsBefore)
    assert.deepEqual(await snapshotFiles(revisionRoot), revisionFilesBeforeTransactions)

    const staleReq = await createLocalReq({ user: owner }, payload)
    const staleID = await payload.db.beginTransaction()
    assert(staleID && payload.db.sessions?.[String(staleID)])
    staleReq.transactionID = staleID
    await payload.db.commitTransaction(staleID)
    let staleWriteInvoked = false
    await assert.rejects(assertLiveAdapterSession(payload.db, staleReq, async () => {
      staleWriteInvoked = true
      await payload.db.updateOne({
        collection: 'media', id: input.expected.mediaId,
        data: { ...rowsBefore.current, alt: 'must-not-write' }, req: staleReq, returning: false,
      })
    }), /session is not live/i)
    assert.equal(staleWriteInvoked, false)
    assert.deepEqual(await rowsFor(payload, input.expected.mediaId), rowsBefore)

    const commitReq = await createLocalReq({ user: owner }, payload)
    await runDedicatedAdapterTransaction({
      db: payload.db,
      req: commitReq,
      execute: ({ write }) => patchAllRows({
        payload, req: commitReq, expected: input.expected, revisions, write, injectFailure: false,
      }),
    })
    const committed = await rowsFor(payload, input.expected.mediaId)
    assert.deepEqual(
      stripStorageRevision({ current: committed.current, versions: committed.versions }),
      stripStorageRevision({ current: rowsBefore.current, versions: rowsBefore.versions }),
    )
    assert.equal(committed.current.storageRevision, revisions.B)
    assert.equal(committed.resolutions.length, 1)
    for (const version of committed.versions) {
      const expectedRevision = version.version.alt === 'Synthetic A' ? revisions.A : revisions.B
      assert.equal(version.version.storageRevision, expectedRevision)
    }
    const capturedAfterCommit = clone(await payload.findByID({
      collection: 'preview-snapshots', id: capturedBefore.id, depth: 0, overrideAccess: false, user: owner,
    }))
    assert.deepEqual(capturedAfterCommit, capturedBefore)
    assert.deepEqual(await snapshotFiles(revisionRoot), revisionFilesBeforeTransactions)
    return {
      revisions,
      candidateProof,
      candidateDigest: candidate.digest,
      rollbackVerified: true,
      staleSessionRejectedBeforeWrite: true,
      migratedVersions: committed.versions.length,
      resolutionRows: committed.resolutions.length,
      revisionFiles: revisionFilesBeforeTransactions.length,
    }
  } finally {
    await closePayload(payload)
  }
}

const assertHTTPRevision = async (fixture, expected, revision, authenticated, status) => {
  for (const file of expected.files) {
    const response = await fixture.request(
      `/api/media/revision/${expected.mediaId}/${revision}/${encodeURIComponent(file.name)}`,
      {},
      authenticated,
    )
    assert.equal(response.status, status)
    if (status === 200) {
      const bytes = Buffer.from(await response.arrayBuffer())
      assert.equal(sha256(bytes), file.sha256)
      assert.equal(bytes.length, file.size)
    }
  }
}

const verifyVersioned = async (input) => {
  const fixture = await startMediaHTTPFixture({
    root: input.mediaDirectory,
    revisionRoot: path.join(input.mediaDirectory, 'revisions'),
    staticDir: path.join(input.mediaDirectory, 'legacy'),
    credentials: input.credentials,
    secret: input.payloadSecret,
    seed: false,
    database: input.postgres
      ? { engine: 'postgres', pool: input.postgres }
      : { engine: 'sqlite', filename: path.join(input.databaseDirectory, 'owner.db') },
    collections: preparedFixtureCollections,
  })
  try {
    const owner = (await fixture.payload.auth({ headers: new Headers({ Cookie: fixture.cookie }) })).user
    assert.equal(owner?.role, 'owner')
    const current = await fixture.payload.findByID({
      collection: 'media', id: input.expected.mediaId, depth: 0, draft: false, overrideAccess: false, user: owner,
    })
    assert.equal(current.alt, 'Synthetic B')
    assert.equal(current.storageRevision, input.migrated.revisions.B)
    await assertHTTPRevision(fixture, { ...input.expected.revisions.B, mediaId: input.expected.mediaId }, input.migrated.revisions.B, false, 200)
    await assertHTTPRevision(fixture, { ...input.expected.revisions.A, mediaId: input.expected.mediaId }, input.migrated.revisions.A, false, 404)
    await assertHTTPRevision(fixture, { ...input.expected.revisions.A, mediaId: input.expected.mediaId }, input.migrated.revisions.A, true, 200)

    const restore = await fixture.request(`/api/media/versions/${input.expected.versionA}`, {
      method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(restore.status, 200)
    const restored = await restore.json()
    assert.equal(restored.storageRevision, input.migrated.revisions.A)
    const restoredResponse = await fixture.request(
      `/api/media/revision/${input.expected.mediaId}/${input.migrated.revisions.A}/${encodeURIComponent(input.expected.filename)}`,
    )
    assert.equal(restoredResponse.status, 200)
    const restoredBytes = Buffer.from(await restoredResponse.arrayBuffer())
    const restoredA = {
      metadata: await sharp(restoredBytes).metadata(),
      pixels: await sharp(restoredBytes).raw().toBuffer(),
    }
    const rgb = (value) => [...value.pixels.subarray(0, 3)]
    const dimensions = (value) => [value.metadata.width, value.metadata.height]
    assert.deepEqual(rgb(restoredA), [255, 0, 0])
    assert.deepEqual(dimensions(restoredA), [1920, 1200])
    await assertHTTPRevision(fixture, { ...input.expected.revisions.A, mediaId: input.expected.mediaId }, input.migrated.revisions.A, true, 200)
    await assertHTTPRevision(fixture, { ...input.expected.revisions.A, mediaId: input.expected.mediaId }, input.migrated.revisions.A, false, 200)
    await assertHTTPRevision(fixture, { ...input.expected.revisions.B, mediaId: input.expected.mediaId }, input.migrated.revisions.B, true, 200)
    await assertHTTPRevision(fixture, { ...input.expected.revisions.B, mediaId: input.expected.mediaId }, input.migrated.revisions.B, false, 404)

    const capturedBefore = input.expected.capturedBefore
    const capturedAfter = clone(await fixture.payload.findByID({
      collection: 'preview-snapshots', id: capturedBefore.id, depth: 0, overrideAccess: false, user: owner,
    }))
    assert.deepEqual(capturedAfter, capturedBefore)
    const resolutions = await fixture.payload.find({
      collection: 'media-migration-resolutions', depth: 0, limit: 10, overrideAccess: false, user: owner,
    })
    assert.equal(resolutions.totalDocs, 1)
    assert.deepEqual({
      snapshotId: resolutions.docs[0].snapshotId,
      manifestHash: resolutions.docs[0].manifestHash,
      mediaId: resolutions.docs[0].mediaId,
      filename: resolutions.docs[0].filename,
      storageRevision: resolutions.docs[0].storageRevision,
    }, {
      snapshotId: String(capturedBefore.id),
      manifestHash: capturedBefore.manifestHash,
      mediaId: String(input.expected.mediaId),
      filename: input.expected.filename,
      storageRevision: input.migrated.revisions.A,
    })

    const body = new FormData()
    const bytesC = await image('C')
    body.set('_payload', JSON.stringify({ alt: 'Synthetic C', _status: 'draft' }))
    body.set('file', new File([bytesC], input.expected.filename, { type: 'image/png' }))
    const update = await fixture.request(`/api/media/${input.expected.mediaId}?draft=true`, { method: 'PATCH', body })
    assert.equal(update.status, 200)
    const edited = (await update.json()).doc
    assert.equal(edited.alt, 'Synthetic C')
    assert.notEqual(edited.storageRevision, input.migrated.revisions.A)
    assert.notEqual(edited.storageRevision, input.migrated.revisions.B)
    const cFiles = await readMediaRevision(fixture.revisionRoot, edited.storageRevision)
    assert.equal(cFiles.length, 4)
    const cEvidence = { mediaId: input.expected.mediaId, files: evidence(cFiles) }
    await assertHTTPRevision(fixture, cEvidence, edited.storageRevision, true, 200)
    await assertHTTPRevision(fixture, cEvidence, edited.storageRevision, false, 404)
    return { downloadsVerified: input.expected.fileCounts.A + input.expected.fileCounts.B + cFiles.length, newRevision: edited.storageRevision }
  } finally {
    await fixture.close()
  }
}

const verifyLegacy = async (input) => {
  const payload = await openPayload({ ...input, prepared: false, push: false })
  try {
    const owner = await ownerFor(payload, input.credentials, false)
    assert.deepEqual(stripStorageRevision(await rowsFor(payload, input.expected.mediaId)), input.expected.rowsBefore)
    const current = await payload.findByID({
      collection: 'media', id: input.expected.mediaId, depth: 0, draft: false, overrideAccess: false, user: owner,
    })
    assert.equal(current.alt, 'Synthetic B')
    assert.equal(current.storageRevision, undefined)
    const files = await filesFrom(path.join(input.mediaDirectory, 'legacy'), filenamesFor(current))
    assert.deepEqual(evidence(files), input.expected.revisions.B.files)
    const capturedAfter = clone(await payload.findByID({
      collection: 'preview-snapshots', id: input.expected.capturedBefore.id, depth: 0, overrideAccess: false, user: owner,
    }))
    assert.deepEqual(capturedAfter, input.expected.capturedBefore)
    return { legacyRowsVerified: 1 + input.expected.rowsBefore.versions.length, legacyFilesVerified: files.length }
  } finally {
    await closePayload(payload)
  }
}

const verifyLegacySourceReadOnly = async (input) => {
  const payload = await openPayload({ ...input, prepared: false, push: false })
  try {
    const rows = stripStorageRevision(await rowsFor(payload, input.expected.mediaId))
    assert.deepEqual(rows, input.expected.rowsBefore)
    assert.equal(rows.current.alt, 'Synthetic B')
    const files = await filesFrom(
      path.join(input.mediaDirectory, 'legacy'),
      input.expected.revisions.B.files.map(({ name }) => name),
    )
    assert.deepEqual(evidence(files), input.expected.revisions.B.files)
    const captured = clone(await payload.db.findOne({
      collection: 'preview-snapshots',
      where: { id: { equals: input.expected.capturedBefore.id } },
    }))
    assert.deepEqual(captured, input.expected.capturedBefore)
    return { sourceRowsVerified: 1 + rows.versions.length, sourceFilesVerified: files.length }
  } finally {
    await closePayload(payload)
  }
}

process.once('message', async (input) => {
  let failure
  try {
    progress(`${input.mode}:start`)
    const result = input.mode === 'legacy-seed' ? await seedLegacy(input)
      : input.mode === 'prepared-migrate' ? await migratePrepared(input)
        : input.mode === 'versioned-verify' ? await verifyVersioned(input)
          : input.mode === 'legacy-verify' ? await verifyLegacy(input)
            : input.mode === 'legacy-source-readonly' ? await verifyLegacySourceReadOnly(input)
            : (() => { throw new Error('Unknown media migration worker mode.') })()
    progress(`${input.mode}:closed`)
    await new Promise((resolve, reject) => process.send({ ok: true, result }, (error) => error ? reject(error) : resolve()))
  } catch (error) {
    failure = error
    await new Promise((resolve) => process.send({ ok: false, error: error instanceof Error ? error.message : 'Unknown media migration failure.' }, resolve))
    process.exitCode = 1
  } finally {
    process.disconnect?.()
    if (input.postgres) process.exit(process.exitCode ?? (failure ? 1 : 0))
  }
})

process.send?.({ ready: true })
