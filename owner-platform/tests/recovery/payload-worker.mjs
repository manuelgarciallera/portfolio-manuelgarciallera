import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { expectAnonymousDraftNotFound } from './anonymous-draft.mjs'

const check = (condition, message) => {
  if (!condition) throw new Error(message)
}

const equal = (actual, expected, message) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message)
}

const sha256File = async (filename) => createHash('sha256').update(await readFile(filename)).digest('hex')

const versionEvidence = (versions) => versions.docs.map(({ id, parent, version }) => ({ id, parent, title: version.title, layout: version.layout }))

const openPayload = async ({ databaseDirectory, mediaDirectory, payloadSecret, postgres, mode }) => {
  process.send?.({ progress: 'worker:loading-payload-module' })
  const { getPayload } = await import('payload')
  process.send?.({ progress: 'worker:loading-application-config' })
  const { default: applicationConfig, createLocalDatabaseAdapter } = await import('../../src/payload.config.ts')
  process.send?.({ progress: 'worker:application-config-loaded' })
  if (!postgres) await mkdir(databaseDirectory, { recursive: true })
  await mkdir(mediaDirectory, { recursive: true })
  const config = await applicationConfig
  const db = postgres
    ? (await import('@payloadcms/db-postgres')).postgresAdapter({ pool: postgres, push: mode === 'seed', disableCreateDatabase: true })
    : { ...createLocalDatabaseAdapter(`file:${path.join(databaseDirectory, 'owner.db').replaceAll('\\', '/')}`), allowIDOnCreate: false, name: 'sqlite' }
  return getPayload({
    key: `physical-recovery-${randomUUID()}`,
    config: {
      ...config,
      collections: config.collections.map((collection) => collection.slug === 'media'
        ? { ...collection, upload: { ...collection.upload, disableLocalStorage: false, staticDir: mediaDirectory } }
        : collection),
      db,
      secret: payloadSecret,
    },
  })
}

const authenticate = async (payload, credentials) => {
  const login = await payload.login({ collection: 'users', data: credentials })
  check(typeof login.token === 'string' && login.token.length > 0, 'Synthetic owner login did not issue a token.')
  const session = await payload.auth({ headers: new Headers({ Authorization: `JWT ${login.token}` }) })
  check(session.user?.role === 'owner', 'Synthetic owner session was not authenticated.')
  return session.user
}

const mediaEvidence = async (mediaDirectory, media) => {
  const original = media.filename
  const derivatives = Object.values(media.sizes ?? {}).map((size) => size?.filename).filter(Boolean)
  check(typeof original === 'string' && original.length > 0, 'Payload did not persist the original media filename.')
  check(new Set(derivatives).size >= 2, 'Payload did not generate at least two real image derivatives.')
  const filenames = [...new Set([original, ...derivatives])].sort()
  const files = []
  for (const filename of filenames) {
    files.push({ filename, sha256: await sha256File(path.join(mediaDirectory, filename)) })
  }
  return files
}

const seed = async ({ credentials, databaseDirectory, mediaDirectory, payloadSecret, postgres }) => {
  process.send?.({ progress: 'seed:opening-payload' })
  const payload = await openPayload({ databaseDirectory, mediaDirectory, payloadSecret, postgres, mode: 'seed' })
  process.send?.({ progress: 'seed:payload-open' })
  try {
    await payload.create({ collection: 'users', overrideAccess: true, data: { ...credentials, role: 'owner' } })
    const owner = await authenticate(payload, credentials)
    const page = await payload.create({
      collection: 'pages', draft: true, overrideAccess: false, user: owner, depth: 0,
      data: {
        title: 'Recovery page initial',
        slug: `recovery-${randomUUID()}`,
        layout: [
          { blockType: 'hero', heading: 'Initial heading' },
          { blockType: 'customFeature', featureKey: 'research-index', heading: 'Initial feature' },
        ],
      },
    })
    const { default: sharp } = await import('sharp')
    const png = await sharp({ create: { width: 1200, height: 900, channels: 4, background: '#315b7d' } }).png().toBuffer()
    const media = await payload.create({
      collection: 'media', draft: true, overrideAccess: false, user: owner, depth: 0,
      data: { alt: 'Synthetic recovery image', caption: 'Generated only for recovery QA' },
      file: { name: 'synthetic-recovery.png', data: png, mimetype: 'image/png', size: png.length },
    })
    const placement = await payload.create({
      collection: 'media-placements', draft: true, overrideAccess: false, user: owner, depth: 0,
      data: {
        name: 'Recovery responsive placement',
        placement: {
          asset: media.id, focalX: 0.35, focalY: 0.6, zoom: 1.4, fit: 'cover', frame: '16:9',
          overrides: {
            mobile: { focalX: 0.7, focalY: 0.45, zoom: 2.1, fit: 'cover', frame: '9:16' },
            tablet: { focalX: 0.5, focalY: 0.5, zoom: 1.2, fit: 'contain', frame: '4:3' },
          },
        },
      },
    })
    const edited = await payload.update({
      collection: 'pages', id: page.id, draft: true, overrideAccess: false, user: owner, depth: 0,
      data: {
        title: 'Recovery page edited',
        layout: [
          { blockType: 'media', asset: media.id, placement: placement.id, caption: 'First after reorder' },
          { blockType: 'hero', heading: 'Edited heading' },
          { blockType: 'customFeature', featureKey: 'research-index', heading: 'Edited feature' },
        ],
      },
    })
    equal(edited.layout.map((block) => block.blockType), ['media', 'hero', 'customFeature'], 'Edited block order was not persisted.')
    await expectAnonymousDraftNotFound(() => payload.findByID({ collection: 'pages', id: page.id, depth: 0, draft: true, overrideAccess: false }))
    const versions = await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, user: owner, overrideAccess: false, limit: 100 })
    check(versions.totalDocs >= 2, 'Page draft history did not contain both seed and edit versions.')
    const files = await mediaEvidence(mediaDirectory, media)
    process.send?.({ progress: 'seed:fixture-complete' })
    return {
      pageId: page.id,
      mediaId: media.id,
      placementId: placement.id,
      versionCount: versions.totalDocs,
      versionHistory: versionEvidence(versions),
      mediaFiles: files,
      expectedLayout: edited.layout.map((block) => ({
        blockType: block.blockType,
        ...(block.heading ? { heading: block.heading } : {}),
        ...(block.caption ? { caption: block.caption } : {}),
      })),
    }
  } finally {
    process.send?.({ progress: 'seed:closing-payload' })
    const client = payload.db?.client
    await payload.destroy()
    client?.close?.()
  }
}

const verifyRestore = async ({ credentials, databaseDirectory, expected, mediaDirectory, payloadSecret, postgres, mode }) => {
  const payload = await openPayload({ databaseDirectory, mediaDirectory, payloadSecret, postgres, mode })
  try {
    const owner = await authenticate(payload, credentials)
    const page = await payload.findByID({ collection: 'pages', id: expected.pageId, draft: true, depth: 0, user: owner, overrideAccess: false })
    check(page.title === 'Recovery page edited', 'Restored page title did not match the saved draft.')
    equal(page.layout.map((block) => ({
      blockType: block.blockType,
      ...(block.heading ? { heading: block.heading } : {}),
      ...(block.caption ? { caption: block.caption } : {}),
    })), expected.expectedLayout, 'Restored block order or text did not match the saved draft.')
    check(page.layout[0]?.asset === expected.mediaId, 'Restored page media relationship did not match.')
    check(page.layout[0]?.placement === expected.placementId, 'Restored page placement relationship did not match.')
    const placement = await payload.findByID({ collection: 'media-placements', id: expected.placementId, draft: true, depth: 0, user: owner, overrideAccess: false })
    equal(placement.placement, {
      asset: expected.mediaId, focalX: 0.35, focalY: 0.6, zoom: 1.4, fit: 'cover', frame: '16:9',
      overrides: {
        mobile: { focalX: 0.7, focalY: 0.45, zoom: 2.1, fit: 'cover', frame: '9:16' },
        tablet: { focalX: 0.5, focalY: 0.5, zoom: 1.2, fit: 'contain', frame: '4:3' },
      },
    }, 'Restored desktop/mobile/tablet placement did not match.')
    const media = await payload.findByID({ collection: 'media', id: expected.mediaId, draft: true, depth: 0, user: owner, overrideAccess: false })
    equal(await mediaEvidence(mediaDirectory, media), expected.mediaFiles, 'Restored original or derivative media hashes did not match.')
    const versions = await payload.findVersions({ collection: 'pages', where: { parent: { equals: expected.pageId } }, user: owner, overrideAccess: false, limit: 100 })
    check(versions.totalDocs === expected.versionCount, 'Restored version history count did not match the backup.')
    equal(versionEvidence(versions), expected.versionHistory, 'Restored version IDs, titles or layouts did not match the backup.')
    await expectAnonymousDraftNotFound(() => payload.findByID({ collection: 'pages', id: expected.pageId, depth: 0, draft: true, overrideAccess: false }))
    if (mode !== 'verify') {
      const independentlyEdited = await payload.update({ collection: 'pages', id: expected.pageId, draft: true, overrideAccess: false, user: owner, data: { title: 'Recovery page restored independently' } })
      check(independentlyEdited.title === 'Recovery page restored independently', 'Independent restored edit did not persist its exact title.')
    }
    return { restoredVersionCount: versions.totalDocs, restoredMediaFileCount: expected.mediaFiles.length }
  } finally {
    const client = payload.db?.client
    await payload.destroy()
    client?.close?.()
  }
}

process.once('message', async (input) => {
  process.send?.({ progress: `${input.mode}:message-received` })
  try {
    const result = input.mode === 'seed' ? await seed(input) : ['restore', 'verify'].includes(input.mode) ? await verifyRestore(input) : (() => { throw new Error('Unknown recovery worker mode.') })()
    await new Promise((resolve, reject) => process.send({ ok: true, result }, (error) => error ? reject(error) : resolve()))
  } catch (error) {
    await new Promise((resolve) => process.send({ ok: false, error: error instanceof Error ? error.message : 'Unknown recovery worker failure.' }, resolve))
    process.exitCode = 1
  } finally {
    process.disconnect?.()
    // Installed drizzle destroy clears schema but does not end its PostgreSQL pool.
    // After Payload destroy and flushed IPC, exit this disposable process to close
    // all its sockets. The controller waits for close and checks server sessions.
    if (input.postgres) process.exit(process.exitCode ?? 0)
  }
})

process.send?.({ ready: true })
