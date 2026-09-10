import { createServer } from 'node:http'
import { S3Client } from '@aws-sdk/client-s3'
import { createObjectRevisionStore } from '../../src/media/object-revision-store'

// Test-only S3 protocol boundary: actual SDK requests, no real account/bucket.
// In-memory server state does not prove provider durability or authentication.
export const startObjectProviderFixture = async () => {
  const objects = new Map<string, Buffer>()
  const failures = { writes: false }
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://127.0.0.1')
    const key = decodeURIComponent(url.pathname.replace(/^\/test-bucket\/?/, ''))
    if (url.searchParams.has('list-type')) {
      const keys = [...objects.keys()].filter(entry => entry.startsWith(url.searchParams.get('prefix')!))
      res.setHeader('Content-Type', 'application/xml')
      res.end(`<ListBucketResult><IsTruncated>false</IsTruncated>${keys.map(entry => `<Contents><Key>${entry}</Key></Contents>`).join('')}</ListBucketResult>`)
    } else if (req.method === 'PUT') {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(Buffer.from(chunk))
      if (failures.writes || req.headers['if-none-match'] !== '*' || objects.has(key)) {
        res.writeHead(failures.writes ? 503 : 412); res.end(); return
      }
      objects.set(key, Buffer.concat(chunks)); res.end()
    } else if (req.method === 'GET' && objects.has(key)) {
      const bytes = objects.get(key)!
      res.setHeader('Content-Length', bytes.length); res.end(bytes)
    } else { res.writeHead(404); res.end() }
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve() })
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing provider fixture port')
  const client = new S3Client({ endpoint: `http://127.0.0.1:${address.port}`, region: 'auto', forcePathStyle: true, maxAttempts: 1,
    credentials: { accessKeyId: 'synthetic-key', secretAccessKey: 'synthetic-secret' },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
  return {
    objects, failures,
    environment: { NODE_ENV: 'test', OWNER_MEDIA_MODE: 'objects', OWNER_MEDIA_ENDPOINT: `http://127.0.0.1:${address.port}`,
      OWNER_MEDIA_REGION: 'auto', OWNER_MEDIA_BUCKET: 'test-bucket', OWNER_MEDIA_PREFIX: 'cms-media',
      OWNER_MEDIA_ACCESS_KEY_ID: 'synthetic-key', OWNER_MEDIA_SECRET_ACCESS_KEY: 'synthetic-secret' },
    storage: createObjectRevisionStore({ client, bucket: 'test-bucket', prefix: 'cms-media' }),
    async close() {
      client.destroy()
      server.closeAllConnections()
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    },
  }
}
