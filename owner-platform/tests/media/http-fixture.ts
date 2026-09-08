import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { Socket } from 'node:net'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig, getPayload, handleEndpoints, type CollectionConfig, type Payload, type SanitizedConfig } from 'payload'
import sharp from 'sharp'

import { Media } from '../../src/collections/Media'
import { Users } from '../../src/collections/Users'
import { createRevisionStorageCollection } from '../../src/media/revision-storage-binding'
import { editorialDatabaseConfig } from '../recovery/postgres-runtime.mjs'

const maxRequestBytes = 8 * 1024 * 1024
const requestTimeoutMs = 15_000

const requestBody = async (request: IncomingMessage) => {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (!Number.isSafeInteger(declared) || declared < 0 || declared > maxRequestBytes) throw new Error('request-too-large')
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size > maxRequestBytes) throw new Error('request-too-large')
    chunks.push(bytes)
  }
  return size ? Buffer.concat(chunks, size) : undefined
}

const copyHeaders = (request: IncomingMessage) => {
  const headers = new Headers()
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    headers.append(request.rawHeaders[index], request.rawHeaders[index + 1])
  }
  return headers
}

const sendResponse = async (response: Response, target: ServerResponse) => {
  target.statusCode = response.status
  response.headers.forEach((value, name) => target.setHeader(name, value))
  target.end(Buffer.from(await response.arrayBuffer()))
}

const closeServer = async (server: ReturnType<typeof createServer>, sockets: Set<Socket>) => {
  server.closeIdleConnections()
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      for (const socket of sockets) socket.destroy()
      server.closeAllConnections()
    }, 2_000)
    server.close((error) => {
      clearTimeout(timer)
      if (error) reject(error)
      else resolve()
    })
  })
}

export type MediaHTTPFixture = {
  allowedNativeOrigin: { hostname: string; pathname: string; port: string; protocol: 'http' }
  close(): Promise<void>
  cookie: string
  origin: string
  payload: Payload
  request(pathname: string, init?: RequestInit, authenticated?: boolean): Promise<Response>
  revisionRoot: string
  staticDir: string
}

export type HTTPRequestRecorder = {
  close(): Promise<void>
  origin: string
  requests: Array<{ cookie: string | undefined; path: string | undefined }>
}

export const startHTTPRequestRecorder = async (): Promise<HTTPRequestRecorder> => {
  const requests: HTTPRequestRecorder['requests'] = []
  const sockets = new Set<Socket>()
  const server = createServer((request, response) => {
    requests.push({ cookie: request.headers.cookie, path: request.url })
    response.statusCode = 204
    response.end()
  })
  server.requestTimeout = requestTimeoutMs
  server.headersTimeout = requestTimeoutMs
  server.keepAliveTimeout = 1_000
  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.once('close', () => sockets.delete(socket))
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server, sockets)
    throw new Error('Recorder did not receive an IPv4 loopback port.')
  }
  return {
    close: () => closeServer(server, sockets),
    origin: `http://127.0.0.1:${address.port}`,
    requests,
  }
}

// Explicit settings are only for isolated recovery workers. Their credentials,
// database and paths never fall back to ambient application configuration.
export type MediaHTTPReopenSettings = {
  root: string
  revisionRoot: string
  staticDir: string
  credentials: { email: string; password: string }
  secret: string
  seed: boolean
  database: { engine: 'sqlite'; filename: string } | { engine: 'postgres'; pool: Parameters<typeof postgresAdapter>[0]['pool'] }
  collections?: CollectionConfig[]
  decorateMedia?: (media: CollectionConfig) => CollectionConfig
}

export const startMediaHTTPFixture = async (settings?: MediaHTTPReopenSettings): Promise<MediaHTTPFixture> => {
  const root = settings ? settings.root : process.env.OWNER_INTEGRATION_DIRECTORY
  if (!root || !path.isAbsolute(root)) throw new Error('OWNER_INTEGRATION_DIRECTORY must be an explicit absolute fixture root.')
  if (settings && (!path.isAbsolute(settings.revisionRoot) || !path.isAbsolute(settings.staticDir)
    || !settings.secret || !settings.credentials.email.endsWith('@example.invalid') || !settings.credentials.password
    || (settings.database.engine === 'sqlite' ? !path.isAbsolute(settings.database.filename) : settings.database.pool?.host !== '127.0.0.1'))) {
    throw new Error('Recovery fixture requires explicit synthetic credentials, private roots and a local database.')
  }

  let config: SanitizedConfig | undefined
  const sockets = new Set<Socket>()
  const server = createServer(async (incoming, outgoing) => {
    const controller = new AbortController()
    incoming.setTimeout(requestTimeoutMs, () => controller.abort())
    try {
      const body = await requestBody(incoming)
      if (!config) throw new Error('fixture-not-ready')
      const request = new Request(`${origin}${incoming.url ?? '/'}`, {
        body,
        headers: copyHeaders(incoming),
        method: incoming.method,
        signal: controller.signal,
        ...(body ? { duplex: 'half' } : {}),
      } as RequestInit)
      await sendResponse(await handleEndpoints({ config, payloadInstanceCacheKey: key, request }), outgoing)
    } catch (error) {
      if (!outgoing.headersSent) {
        outgoing.statusCode = error instanceof Error && error.message === 'request-too-large' ? 413 : 500
        outgoing.setHeader('Content-Type', 'application/json')
      }
      outgoing.end(JSON.stringify({ error: 'fixture-request-failed' }))
    }
  })
  server.requestTimeout = requestTimeoutMs
  server.headersTimeout = requestTimeoutMs
  server.keepAliveTimeout = 1_000
  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.once('close', () => sockets.delete(socket))
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server, sockets)
    throw new Error('Fixture did not receive an IPv4 loopback port.')
  }
  const origin = `http://127.0.0.1:${address.port}`
  const allowedNativeOrigin = {
    hostname: '127.0.0.1', pathname: '/api/media/revision/**', port: String(address.port), protocol: 'http' as const,
  }
  const key = `versioned-media-http-${randomUUID()}`
  const revisionRoot = settings?.revisionRoot ?? path.join(root, 'http-private-revisions')
  const staticDir = settings?.staticDir ?? path.join(root, 'http-unused-native-media')

  let payload: Payload | undefined
  try {
    await mkdir(revisionRoot, { recursive: Boolean(settings) })
    await mkdir(staticDir, { recursive: Boolean(settings) })
    const database: { engine: 'sqlite' } | { engine: 'postgres'; pool: Parameters<typeof postgresAdapter>[0]['pool'] } = settings ? settings.database : await editorialDatabaseConfig(process.env, {
      cache: fileURLToPath(new URL('../../node_modules/.cache', import.meta.url)),
    })
    const rawMedia = settings?.decorateMedia ? settings.decorateMedia(Media) : Media
    const bound = await createRevisionStorageCollection(rawMedia, { nativeFetchOrigin: origin, revisionRoot, staticDir })
    const upload = typeof bound.upload === 'object' ? bound.upload : {}
    config = await buildConfig({
      collections: [Users, { ...bound, upload: { ...upload, skipSafeFetch: [allowedNativeOrigin] } }, ...(settings?.collections ?? [])],
      db: database.engine === 'postgres'
        ? postgresAdapter({ pool: database.pool, push: settings?.seed ?? true, disableCreateDatabase: true, schemaName: 'versioned_media_http_fixture' })
        : sqliteAdapter({ client: { url: `file:${(settings?.database.engine === 'sqlite' ? settings.database.filename : path.join(root, 'versioned-media-http.db')).replaceAll('\\', '/')}` }, transactionOptions: {}, ...(settings ? { push: settings.seed } : {}) }),
      graphQL: { disable: true },
      secret: settings?.secret ?? randomUUID() + randomUUID(),
      sharp,
    })
    payload = await getPayload({ config, key })
    const email = settings?.credentials.email ?? 'versioned-http-owner@example.invalid'
    const password = settings?.credentials.password ?? randomUUID() + randomUUID()
    if (!settings || settings.seed) await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, role: 'owner' } })

    const login = await fetch(`${origin}/api/users/login`, {
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(requestTimeoutMs),
    })
    if (login.status !== 200) throw new Error(`Fixture owner login failed with ${login.status}.`)
    const cookie = login.headers.get('set-cookie')?.split(';', 1)[0]
    if (!cookie) throw new Error('Fixture owner login did not return an authentication cookie.')

    return {
      allowedNativeOrigin,
      cookie,
      origin,
      payload,
      revisionRoot,
      staticDir,
      request: (pathname, init = {}, authenticated = true) => {
        const url = new URL(pathname, origin)
        if (url.origin !== origin) return Promise.reject(new Error('Fixture requests must stay on their exact loopback origin.'))
        const headers = new Headers(init.headers)
        headers.set('Origin', origin)
        if (authenticated) headers.set('Cookie', cookie)
        else headers.delete('Cookie')
        return fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(requestTimeoutMs) })
      },
      close: async () => {
        await closeServer(server, sockets)
        const database = payload?.db as unknown as { name?: string; client?: { close(): void } }
        await payload?.destroy()
        if (database?.name === 'sqlite') database.client?.close()
      },
    }
  } catch (error) {
    await closeServer(server, sockets)
    await payload?.destroy()
    throw error
  }
}
