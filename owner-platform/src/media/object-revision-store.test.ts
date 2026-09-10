import { createServer, type Server } from 'node:http'
import { mkdtemp, readdir, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { S3Client } from '@aws-sdk/client-s3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createObjectRevisionStore } from './object-revision-store'
import { createTransportRevisionStorageCollection } from './revision-storage-binding'
import { Media } from '../collections/Media'

describe('object revision transport with real S3 HTTP requests', () => {
  let server: Server
  let endpoint: string
  let objects: Map<string, Buffer>
  let requests: { method: string; key: string; condition?: string }[]
  let clients: S3Client[]
  let failPut: number
  let putCount: number
  let holdKey: string
  let rejectPut: boolean
  let truncatedList: boolean
  let failAfterPut: number
  let shortBodyKey: string
  let corruptPut: number
  let concurrentPut: number
  let rewriteRecovery: boolean

  const client = () => {
    const result = new S3Client({
      endpoint, region: 'auto', forcePathStyle: true, maxAttempts: 1,
      credentials: { accessKeyId: 'synthetic-key', secretAccessKey: 'synthetic-secret' },
      requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
    })
    clients.push(result)
    return result
  }
  const store = (timeoutMs = 15000) => createObjectRevisionStore({ client: client(), bucket: 'test-bucket', prefix: 'owner-media', timeoutMs })
  const files = () => [
    { name: 'original.png', bytes: Buffer.from('original-image') },
    { name: 'small.webp', bytes: Buffer.from('small-image') },
  ]

  beforeEach(async () => {
    objects = new Map(); requests = []; clients = []
    failPut = 0; putCount = 0; holdKey = ''; rejectPut = false; truncatedList = false; failAfterPut = 0; shortBodyKey = ''; corruptPut = 0; concurrentPut = 0; rewriteRecovery = false
    server = createServer(async (req, res) => {
      const url = new URL(req.url!, 'http://127.0.0.1')
      const key = decodeURIComponent(url.pathname.replace(/^\/test-bucket\/?/, ''))
      requests.push({ method: req.method!, key, condition: req.headers['if-none-match'] })
      const error = (status: number, code: string) => {
        res.writeHead(status, { 'Content-Type': 'application/xml' })
        res.end(`<Error><Code>${code}</Code><Message>Synthetic failure</Message></Error>`)
      }
      if (url.searchParams.has('list-type')) {
        const prefix = url.searchParams.get('prefix')!
        const entries = [...objects.keys()].filter((value) => value.startsWith(prefix))
        res.setHeader('Content-Type', 'application/xml')
        res.end(`<ListBucketResult><IsTruncated>${truncatedList}</IsTruncated>${entries.map((value) => `<Contents><Key>${value}</Key><Size>${objects.get(value)!.length}</Size></Contents>`).join('')}</ListBucketResult>`)
      } else if (req.method === 'PUT') {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))
        putCount++
        if (putCount === concurrentPut) objects.set(key, Buffer.from('concurrent-writer'))
        if (rejectPut || (objects.has(key) && req.headers['if-none-match'] === '*')) return error(412, 'PreconditionFailed')
        if (putCount === failPut) return error(503, 'ServiceUnavailable')
        objects.set(key, Buffer.concat(chunks))
        if (putCount === corruptPut) objects.set(key, Buffer.from('unexpected-provider-bytes'))
        if (rewriteRecovery && key.startsWith('recovered-media/') && key.endsWith('/manifest.json')) {
          const manifest = JSON.parse(objects.get(key)!.toString())
          const replacement = Buffer.alloc(manifest.files[0].size, 65)
          objects.set(key.replace('/manifest.json', '/files/0'), replacement)
          manifest.files[0].sha256 = createHash('sha256').update(replacement).digest('hex')
          objects.set(key, Buffer.from(JSON.stringify(manifest)))
        }
        if (putCount === failAfterPut) return error(503, 'ServiceUnavailable')
        res.setHeader('ETag', '"synthetic-etag"')
        res.end()
      } else if (req.method === 'GET') {
        const bytes = objects.get(key)
        if (!bytes) return error(404, 'NoSuchKey')
        res.setHeader('Content-Length', bytes.length)
        if (key === holdKey) { res.flushHeaders(); res.write(bytes.subarray(0, 1)); return }
        if (key === shortBodyKey) { res.end(bytes.subarray(0, 1)); return }
        res.end(bytes)
      } else error(405, 'MethodNotAllowed')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing loopback fixture')
    endpoint = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    clients.forEach((value) => value.destroy())
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })

  it('preserves historical bytes and can reopen without client-side state', async () => {
    const storage = store()
    const first = await storage.write(files())
    const second = await storage.write([{ name: 'original.png', bytes: Buffer.from('replacement') }])
    expect(first).not.toBe(second)
    expect(await store().read(first)).toEqual(files())
    expect(await storage.read(second)).toEqual([{ name: 'original.png', bytes: Buffer.from('replacement') }])
    const puts = requests.filter((request) => request.method === 'PUT')
    expect(puts.map((request) => request.condition)).toEqual(['*', '*', '*', '*', '*'])
    expect(puts[2].key).toBe(`owner-media/${first}/manifest.json`)
    expect(puts[4].key).toBe(`owner-media/${second}/manifest.json`)
  })

  const recoveryStore = (timeoutMs = 15000) => createObjectRevisionStore({ client: client(), bucket: 'test-bucket', prefix: 'recovered-media', timeoutMs })

  it('restores a verified revision to an empty namespace without changing its database identifier', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    const snapshot = await store().read(revision)
    const sourceKeys = [...objects.keys()]
    const recovery = recoveryStore()
    expect(await recovery.restore(revision, manifest, snapshot)).toBe(revision)
    expect(await recoveryStore().read(revision)).toEqual(files())
    expect(await store().read(revision)).toEqual(files())
    expect(sourceKeys.every((key) => objects.has(key))).toBe(true)
    const puts = requests.filter(({ method, key }) => method === 'PUT' && key.startsWith('recovered-media/'))
    expect(puts.map(({ condition }) => condition)).toEqual(['*', '*', '*'])
    expect(puts.at(-1)!.key).toBe(`recovered-media/${revision}/manifest.json`)
  })

  it.each(['identity', 'corrupt', 'missing', 'extra', 'name'])('rejects a %s recovery package before contacting the destination', async (fault) => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    const snapshot = files()
    if (fault === 'identity') manifest.revision = '22222222-2222-4222-8222-222222222222'
    if (fault === 'corrupt') snapshot[0].bytes = Buffer.from('corrupt')
    if (fault === 'missing') snapshot.pop()
    if (fault === 'extra') snapshot.push({ name: 'extra.png', bytes: Buffer.from('extra') })
    if (fault === 'name') snapshot[0].name = '../unsafe'
    const before = requests.length
    await expect(recoveryStore().restore(revision, manifest, snapshot)).rejects.toThrow()
    expect(requests.length).toBe(before)
  })

  it('refuses a nonempty revision prefix without replacing or deleting any object', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    const foreignKey = `recovered-media/${revision}/unexpected`
    objects.set(foreignKey, Buffer.from('keep'))
    const before = new Map(objects)
    const requestStart = requests.length
    await expect(recoveryStore().restore(revision, manifest, files())).rejects.toThrow()
    expect(objects).toEqual(before)
    expect(requests.slice(requestStart).some(({ method }) => method !== 'GET')).toBe(false)
  })

  it('keeps an interrupted restore private and refuses to overwrite its partial destination on retry', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    failPut = putCount + 2
    const recovery = recoveryStore()
    const error = await recovery.restore(revision, manifest, files()).catch((value: unknown) => value) as Error & { revision: string }
    expect(error.revision).toBe(revision)
    expect(objects.has(`recovered-media/${revision}/manifest.json`)).toBe(false)
    expect(objects.get(`recovered-media/${revision}/files/0`)).toEqual(files()[0].bytes)
    await expect(recovery.read(revision)).rejects.toThrow()
    const afterFailure = new Map(objects)
    failPut = 0
    await expect(recovery.restore(revision, manifest, files())).rejects.toThrow()
    expect(objects).toEqual(afterFailure)
    expect(await store().read(revision)).toEqual(files())
  })

  it('does not report recovery success when post-write verification detects corrupt destination bytes', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    corruptPut = putCount + 1
    await expect(recoveryStore().restore(revision, manifest, files())).rejects.toMatchObject({ revision })
    expect(objects.get(`recovered-media/${revision}/files/0`)).toEqual(Buffer.from('unexpected-provider-bytes'))
    expect(requests.some(({ method }) => method === 'DELETE')).toBe(false)
    expect(await store().read(revision)).toEqual(files())
  })

  it('compares the final recovered bytes to the approved backup even if the destination manifest is replaced consistently', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    rewriteRecovery = true
    await expect(recoveryStore().restore(revision, manifest, files())).rejects.toMatchObject({ revision })
    expect(await store().read(revision)).toEqual(files())
  })

  it('preserves a competing writer arriving after the empty LIST and stops before committing the manifest', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    concurrentPut = putCount + 2
    await expect(recoveryStore().restore(revision, manifest, files())).rejects.toMatchObject({ revision })
    expect(objects.get(`recovered-media/${revision}/files/0`)).toEqual(files()[0].bytes)
    expect(objects.get(`recovered-media/${revision}/files/1`)).toEqual(Buffer.from('concurrent-writer'))
    expect(objects.has(`recovered-media/${revision}/manifest.json`)).toBe(false)
    expect(requests.some(({ method }) => method === 'DELETE')).toBe(false)
    expect(await store().read(revision)).toEqual(files())
  })

  it('snapshots recovery inputs before awaiting the provider', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    const snapshot = files()
    const restoration = recoveryStore().restore(revision, manifest, snapshot)
    snapshot[0].bytes.fill(0)
    manifest.files[0].name = 'changed.png'
    await expect(restoration).resolves.toBe(revision)
    expect(await recoveryStore().read(revision)).toEqual(files())
  })

  it('bounds restoration through the final verification body, not just the PUT responses', async () => {
    const revision = await store().write(files())
    const manifest = JSON.parse(objects.get(`owner-media/${revision}/manifest.json`)!.toString())
    holdKey = `recovered-media/${revision}/files/0`
    const started = performance.now()
    await expect(recoveryStore(200).restore(revision, manifest, files())).rejects.toMatchObject({ revision })
    expect(performance.now() - started).toBeLessThan(2000)
    expect(objects.has(`recovered-media/${revision}/manifest.json`)).toBe(true)
    holdKey = ''
    expect(await recoveryStore().read(revision)).toEqual(files())
  })

  it('binds uploads and guarded historical reads to object storage without writing native files', async () => {
    const staticDir = await mkdtemp(path.join(tmpdir(), 'owner-object-binding-'))
    try {
      const bound = await createTransportRevisionStorageCollection(Media, { store: store(), staticDir })
      const save = bound.hooks!.beforeChange!.at(-1)!
      const data = await save({ data: { filename: 'original.png', mimeType: 'image/png', sizes: {
        small: { filename: 'small.webp', mimeType: 'image/webp' },
      } }, req: { file: { data: Buffer.from('original-image') }, payloadUploadSizes: { small: Buffer.from('small-image') } } } as never)
      expect(await store().read(data.storageRevision)).toEqual(files())
      const published = { ...data, id: '1', _status: 'published' }
      const handler = bound.endpoints && bound.endpoints.find((entry) => entry.path.startsWith('/revision/'))?.handler
      if (!handler) throw new Error('Missing guarded revision endpoint')
      // Only the database boundary is substituted; uploads and object HTTP are real.
      const request = (current = published, user: unknown = null) => ({
        routeParams: { id: '1', revision: data.storageRevision, filename: 'small.webp' }, user,
        payload: {
          findByID: async (args: { overrideAccess: boolean }) => {
            expect(args.overrideAccess).toBe(false)
            return current
          },
          findVersions: async (args: { overrideAccess: boolean; where: unknown }) => {
            expect(args.overrideAccess).toBe(false)
            expect(args.where).toEqual({ and: [{ parent: { equals: '1' } }, { 'version.storageRevision': { equals: data.storageRevision } }] })
            return { docs: [{ version: published }] }
          },
        },
      })
      const response = await handler(request() as never)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('small-image')
      expect(response.headers.get('cache-control')).toBe('private, no-store')
      expect(response.headers.get('content-type')).toBe('image/webp')
      const before = requests.length
      expect((await handler(request({ ...published, _status: 'draft' }) as never)).status).toBe(404)
      const replacement = { ...published, storageRevision: '22222222-2222-4222-8222-222222222222' }
      expect((await handler(request(replacement) as never)).status).toBe(404)
      expect(requests.length).toBe(before)
      const historical = await handler(request(replacement, { id: 1, collection: 'users', role: 'owner' }) as never)
      expect(historical.status).toBe(200)
      expect(await historical.text()).toBe('small-image')
      objects.set(`owner-media/${data.storageRevision}/files/1`, Buffer.from('broken'))
      expect((await handler(request() as never)).status).toBe(404)
      expect(await readdir(staticDir)).toEqual([])
    } finally { await rmdir(staticDir) }
  })

  it('retains partial writes with a reconcilable revision and never commits a manifest after failure', async () => {
    failPut = 2
    const error = await store().write(files()).catch((value: unknown) => value) as Error & { revision: string }
    expect(error).toBeInstanceOf(Error)
    expect(error.revision).toMatch(/^[0-9a-f-]{36}$/)
    expect([...objects.keys()]).toEqual([`owner-media/${error.revision}/files/0`])
    expect(requests.some(({ method }) => method === 'DELETE')).toBe(false)
  })

  it('does not retry a conditional conflict as an unconditional write', async () => {
    rejectPut = true
    await expect(store().write(files())).rejects.toThrow()
    expect(requests.map(({ method, condition }) => [method, condition])).toEqual([['PUT', '*']])
    expect(objects.size).toBe(0)
  })

  it('retains a committed revision after an ambiguous manifest response for explicit reconciliation', async () => {
    failAfterPut = 3
    const storage = store()
    const error = await storage.write(files()).catch((value: unknown) => value) as Error & { revision: string }
    expect(error).toBeInstanceOf(Error)
    expect(await storage.read(error.revision)).toEqual(files())
    expect(requests.filter(({ method }) => method === 'DELETE')).toEqual([])
  })

  it.each(['json', 'identity', 'oversized', 'utf8'])('rejects a %s invalid remote manifest', async (fault) => {
    const storage = store()
    const revision = await storage.write(files())
    const key = `owner-media/${revision}/manifest.json`
    if (fault === 'json') objects.set(key, Buffer.from('{'))
    if (fault === 'identity') {
      const manifest = JSON.parse(objects.get(key)!.toString())
      manifest.revision = '22222222-2222-4222-8222-222222222222'
      objects.set(key, Buffer.from(JSON.stringify(manifest)))
    }
    if (fault === 'oversized') objects.set(key, Buffer.alloc(65537, 32))
    if (fault === 'utf8') objects.set(key, Buffer.from([0xff]))
    await expect(storage.read(revision)).rejects.toThrow()
  })

  it.each(['corrupt', 'missing', 'extra', 'short', 'long', 'truncated-list'])('rejects %s revision data', async (fault) => {
    const storage = store()
    const revision = await storage.write(files())
    const key = `owner-media/${revision}/files/0`
    if (fault === 'corrupt') objects.set(key, Buffer.alloc(objects.get(key)!.length, 0))
    if (fault === 'missing') objects.delete(key)
    if (fault === 'extra') objects.set(`owner-media/${revision}/unexpected`, Buffer.from('x'))
    if (fault === 'short') objects.set(key, Buffer.from('x'))
    if (fault === 'long') objects.set(key, Buffer.alloc(100))
    if (fault === 'truncated-list') truncatedList = true
    await expect(storage.read(revision)).rejects.toThrow()
  })

  it('aborts a body that never reaches EOF within the operation deadline', async () => {
    const revision = await store().write(files())
    holdKey = `owner-media/${revision}/files/0`
    const started = performance.now()
    await expect(store(150).read(revision)).rejects.toThrow()
    expect(performance.now() - started).toBeLessThan(2000)
  })

  it('rejects a network body shorter than its advertised content length', async () => {
    const revision = await store().write(files())
    shortBodyKey = `owner-media/${revision}/files/0`
    await expect(store(200).read(revision)).rejects.toThrow()
  })

  it('rejects invalid identifiers and files before sending a request', async () => {
    const storage = store()
    await expect(storage.read('../foreign')).rejects.toThrow()
    await expect(storage.write([{ name: '../x', bytes: Buffer.from('x') }])).rejects.toThrow()
    expect(() => createObjectRevisionStore({ client: client(), bucket: 'test-bucket', prefix: '../foreign' })).toThrow()
    expect(() => createObjectRevisionStore({ client: client(), bucket: 'test-bucket', prefix: undefined as never })).toThrow()
    expect(requests).toEqual([])
  })
})
