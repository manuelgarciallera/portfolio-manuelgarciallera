import assert from 'node:assert/strict'
import { createHash, X509Certificate } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { request as httpRequest } from 'node:http'
import { createServer } from 'node:https'
import path from 'node:path'
import { runCommand } from '../recovery/postgres-runtime.mjs'

// Test-only HTTPS entrypoint so native browser Origin and the configured
// production serverURL agree. Never add localhost to production CSRF policy.
export const startBrowserProxy = async ({ root, openssl, targetOrigin }) => {
  const target = new URL(targetOrigin)
  assert.equal(target.hostname, '127.0.0.1')
  assert.equal(target.protocol, 'http:')
  const keyPath = path.join(root, 'browser-key.pem')
  const certPath = path.join(root, 'browser-cert.pem')
  await runCommand(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath,
    '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'])
  const cert = await readFile(certPath)
  const spki = new X509Certificate(cert).publicKey.export({ type: 'spki', format: 'der' })
  const certificatePin = createHash('sha256').update(spki).digest('base64')
  const server = createServer({ key: await readFile(keyPath), cert }, (incoming, response) => {
    const upstream = httpRequest({ hostname: target.hostname, port: target.port, method: incoming.method, path: incoming.url,
      headers: { ...incoming.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': incoming.headers.host } }, (result) => {
      result.on('error', () => response.destroy())
      if (response.destroyed) { result.destroy(); return }
      response.writeHead(result.statusCode ?? 502, result.headers)
      result.pipe(response)
    })
    upstream.setTimeout(30_000, () => upstream.destroy())
    upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end() })
    incoming.on('aborted', () => upstream.destroy())
    incoming.on('error', () => upstream.destroy())
    response.on('close', () => upstream.destroy())
    response.on('error', () => upstream.destroy())
    incoming.pipe(upstream)
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  return {
    origin: `https://127.0.0.1:${server.address().port}`, certificatePin,
    async close() {
      server.closeAllConnections()
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    },
  }
}
