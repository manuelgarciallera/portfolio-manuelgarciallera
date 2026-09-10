import assert from 'node:assert/strict'
import { createHash, X509Certificate } from 'node:crypto'
import { mkdtemp } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'
import { cleanupTask } from '../recovery/postgres-runtime.mjs'
import { startBrowserProxy } from './browser-proxy.mjs'

// Fail before an expensive build or database creation if local TLS cannot
// support native-origin editing. This is not a substitute for the editor test.
export const verifyBrowserTLS = async ({ cwd, openssl }) => {
  const cache = path.join(cwd, 'node_modules/.cache')
  const root = await mkdtemp(path.join(cache, 'owner-browser-tls-'))
  const target = createServer((_request, response) => response.end('Synthetic browser TLS probe'))
  let proxy, browser, page
  let closed = false
  let childrenClosed = true
  try {
    await new Promise((resolve, reject) => { target.once('error', reject); target.listen(0, '127.0.0.1', resolve) })
    proxy = await startBrowserProxy({ root, openssl, targetOrigin: `http://127.0.0.1:${target.address().port}` })
    browser = await chromium.launch({ args: [`--ignore-certificate-errors-spki-list=${proxy.certificatePin}`] })
    page = await browser.newPage()
    const response = await page.goto(proxy.origin, { timeout: 15_000 })
    assert.equal(response?.status(), 200)
    assert.equal(await page.locator('body').textContent(), 'Synthetic browser TLS probe')
  } catch (cause) {
    if (cause?.childClosed === false) childrenClosed = false
    // Read-only diagnosis: expose only the issuer and whether the public key
    // matches our fixture. Never print a certificate, cookie or credential.
    if (page && proxy) try {
      const session = await page.context().newCDPSession(page)
      const { tableNames } = await session.send('Network.getCertificate', { origin: proxy.origin })
      if (tableNames[0]) {
        const peer = new X509Certificate(Buffer.from(tableNames[0], 'base64'))
        const pin = createHash('sha256').update(peer.publicKey.export({ type: 'spki', format: 'der' })).digest('base64')
        console.error(JSON.stringify({ browserTLSIssuer: peer.issuer, fixtureKeyMatches: pin === proxy.certificatePin }))
      }
      await session.detach()
    } catch { /* Diagnostics must not replace the original trust failure. */ }
    throw new Error('Synthetic browser TLS preflight failed before build. Check certificate interception or browser trust; do not disable CSRF or TLS verification.', { cause })
  } finally {
    try {
      const results = await Promise.allSettled([
        browser?.close(), proxy?.close(),
        (async () => {
          target.closeAllConnections()
          if (target.listening) await new Promise((resolve, reject) => target.close(error => error ? reject(error) : resolve()))
        })(),
      ])
      closed = results.every(result => result.status === 'fulfilled')
      if (!closed) throw new Error('Browser TLS preflight cleanup could not be verified')
    } finally {
      await cleanupTask({ cache, root, stopped: closed, workersClosed: closed && childrenClosed, taskPrefix: 'owner-browser-tls-' })
    }
  }
}
