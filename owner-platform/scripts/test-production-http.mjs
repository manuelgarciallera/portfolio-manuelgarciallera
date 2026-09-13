import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createPostgresCluster, preflightTools, runCommand, safeEnvironment } from '../tests/recovery/postgres-runtime.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'
import { verifyProductionBrowserLogin } from '../tests/production/browser-login.mjs'
import { startBrowserProxy } from '../tests/production/browser-proxy.mjs'
import { verifyBrowserTLS } from '../tests/production/browser-tls-preflight.mjs'
import { verifyProductionObjectMedia } from '../tests/production/object-media.mjs'
import { verifyObjectTLS } from '../tests/production/object-tls-preflight.mjs'
import { prepareEditorAssets } from './prepare-editor-assets.mjs'
import { prepareLexicalField } from './lexical-field-patch.mjs'

await prepareLexicalField()

const cwd = fileURLToPath(new URL('../', import.meta.url))
const next = path.join(cwd, 'node_modules/next/dist/bin/next')
const objectMedia = process.argv.includes('--object-media')
const browserEditor = process.argv.includes('--browser-editor')
const openssl = process.env.OWNER_TEST_OPENSSL || (process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl')
if (objectMedia || browserEditor) await runCommand(openssl, ['version'])
if (objectMedia || browserEditor) await mkdir(path.join(cwd, 'node_modules/.cache'), { recursive: true })
if (browserEditor) await verifyBrowserTLS({ cwd, openssl })
if (objectMedia) await verifyObjectTLS({ cwd, openssl })
const { tools } = await preflightTools(process.env.OWNER_POSTGRES_BIN)
const env = safeEnvironment()
// Prevent Next's dotenv loader from importing any developer/provider values.
for (const name of await readdir(cwd)) if (/^\.env(?:\..+)?$/.test(name)) {
  for (const line of (await readFile(path.join(cwd, name), 'utf8')).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    if (match) env[match[1]] = ''
  }
}
const secret = randomBytes(32).toString('hex')
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', PAYLOAD_SECRET: secret,
  OWNER_PLATFORM_BUILD_PHASE: '1', DATABASE_URL: '', LOCAL_DATABASE_NAME: '', OWNER_MEDIA_MODE: '',
  OWNER_SERVER_URL: 'https://owner.example.invalid', OWNER_EMAIL_API_KEY: 're_synthetic_qa_only',
  OWNER_EMAIL_FROM: 'owner@example.invalid' })
console.log('[production-http] build with synthetic configuration')
await prepareEditorAssets()
await runCommand(process.execPath, [next, 'build'], { cwd, env, timeout: 600_000, secrets: [secret] })
const postgres = await createPostgresCluster({ cache: path.join(cwd, 'node_modules/.cache'), kind: 'recovery', tools })
let app
let closed = true
let closePromise
let objectEnvironment
let browserProxy
let infrastructureClosed = true
try {
  const pool = await postgres.initialize()
  const worker = path.join(postgres.root, 'production-seed.mjs')
  await build({ absWorkingDir: cwd, bundle: true, entryPoints: [path.join(cwd, 'tests/production/seed-worker.mjs')],
    outfile: worker, format: 'esm', platform: 'node', packages: 'external' })
  const credentials = { email: `production-${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') }
  await runWorker(worker, { mode: 'seed', postgres: pool, payloadSecret: secret, credentials, objectMedia }, cwd)
  assert(workersClosed())
  const connection = new URL(`postgresql://${pool.host}:${pool.port}/${pool.database}`)
  connection.username = pool.user
  connection.password = pool.password
  Object.assign(env, { DATABASE_URL: connection.href, OWNER_PLATFORM_BUILD_PHASE: '', NEXT_PHASE: '' })
  const port = await new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => { const value = probe.address().port; probe.close(error => error ? reject(error) : resolve(value)) })
  })
  const origin = `http://127.0.0.1:${port}`
  if (objectMedia) {
    const fixtureModule = path.join(postgres.root, 'object-environment.mjs')
    await build({ absWorkingDir: cwd, bundle: true, entryPoints: [path.join(cwd, 'tests/production/object-environment.mjs')],
      outfile: fixtureModule, format: 'esm', platform: 'node', packages: 'external' })
    const { startProductionObjectEnvironment } = await import(pathToFileURL(fixtureModule).href)
    objectEnvironment = await startProductionObjectEnvironment({ root: postgres.root, openssl })
    Object.assign(env, objectEnvironment.environment)
  }
  if (browserEditor) {
    browserProxy = await startBrowserProxy({ root: postgres.root, openssl, targetOrigin: origin })
    env.OWNER_SERVER_URL = browserProxy.origin
  }
  const stop = async () => {
    if (closed) return
    if (process.platform === 'win32') await runCommand('taskkill', ['/PID', String(app.pid), '/T', '/F'])
    else app.kill('SIGTERM')
    await Promise.race([closePromise, new Promise((_, reject) => setTimeout(() => reject(new Error('App close not observed')), 15_000).unref())])
    assert(closed)
  }
  const start = async () => {
    app = spawn(process.execPath, [next, 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    closed = false
    closePromise = new Promise(resolve => app.once('close', () => { closed = true; resolve() }))
    app.on('error', () => {})
    // Drain: partial/interleaved runtime diagnostics cannot be safely redacted.
    app.stdout.resume(); app.stderr.resume()
    for (let attempt = 0; attempt < 80; attempt++) {
      assert(!closed, 'Next exited before readiness')
      try { if ((await fetch(`${origin}/admin/login`, { signal: AbortSignal.timeout(3000) })).status === 200) return }
      catch { /* bounded loopback readiness */ }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    throw new Error('Next login did not become ready')
  }
  try {
    await start()
    const browserDrafts = await verifyProductionBrowserLogin(browserProxy?.origin ?? origin, credentials,
      { editor: browserEditor, certificatePin: browserProxy?.certificatePin, compact: process.argv.includes('--compact-viewports') })
    const login = await fetch(`${origin}/api/users/login`, { signal: AbortSignal.timeout(10_000), method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
    assert.equal(login.status, 200, 'Owner login over production HTTP')
    const { token } = await login.json()
    assert.equal(typeof token, 'string')
    const request = (route, options = {}) => fetch(origin + route, { ...options, signal: AbortSignal.timeout(10_000), headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json', ...options.headers } })
    if (browserEditor) {
      assert.equal(browserDrafts.length, 6, 'Three independently authored pages per viewport')
      assert.equal(new Set(browserDrafts.map(draft => draft.id)).size, 6)
    }
    const brandIds = [...new Set(browserDrafts.map(draft => draft.brandProfile).filter(id => id != null))]
    let projectsBefore = []
    if (browserEditor) {
      const response = await request('/api/projects?draft=true&depth=0&limit=10')
      assert.equal(response.status, 200)
      const result = await response.json()
      assert.equal(result.totalDocs, 2, 'One browser-edited project fixture per viewport')
      projectsBefore = result.docs
      assert(projectsBefore.every(project => project._status === 'draft'))
      // No JWT or cookies: changing project access must not expose an authored
      // draft through either the default read path or the explicit draft path.
      for (const query of ['', '?draft=true']) {
        const anonymousProjects = await fetch(`${origin}/api/projects${query}`, { signal: AbortSignal.timeout(10_000) })
        assert.equal(anonymousProjects.status, 200)
        const listed = await anonymousProjects.json()
        assert.equal(listed.totalDocs, 0, 'Project drafts remain private')
        assert.deepEqual(listed.docs, [])
        for (const project of projectsBefore) {
          const detail = await fetch(`${origin}/api/projects/${project.id}${query}`, { signal: AbortSignal.timeout(10_000) })
          assert.equal(detail.status, 404, 'Anonymous project lookup must not disclose a draft')
          const denial = await detail.text()
          assert(!denial.includes(project.title) && !denial.includes(project.summary), 'Project denial must not disclose authored text')
        }
      }
      const history = await fetch(`${origin}/api/projects/versions`, { signal: AbortSignal.timeout(10_000) })
      assert.equal(history.status, 403, 'Anonymous visitors cannot enumerate project history')
      await history.arrayBuffer()
      for (const project of projectsBefore) {
        const versions = await request(`/api/projects/versions?where[parent][equals]=${project.id}&depth=0`)
        assert.equal(versions.status, 200)
        const { docs } = await versions.json()
        assert(docs.length > 0, 'The privacy check must target an existing project version')
        const versionId = docs[0].id
        const ownedVersion = await request(`/api/projects/versions/${versionId}?depth=0`)
        assert.equal(ownedVersion.status, 200, 'Owner can read the exact version being tested')
        const snapshot = await ownedVersion.json()
        assert.equal(snapshot.version.summary, project.summary)
        const anonymousVersion = await fetch(`${origin}/api/projects/versions/${versionId}?depth=0`, {
          signal: AbortSignal.timeout(10_000),
        })
        assert.equal(anonymousVersion.status, 403, 'Knowing a version ID must not reveal project history')
        const denial = await anonymousVersion.text()
        assert(!denial.includes(project.summary) && !denial.includes(project.caseStudyLayout[0].quote),
          'Version denial must not contain authored project content')
      }
      console.log('[production-http] anonymous project drafts and version history remain private')
    }
    let articlesBefore = []
    if (browserEditor) {
      const response = await request('/api/articles?draft=true&depth=0&limit=10')
      assert.equal(response.status, 200)
      const result = await response.json()
      assert.equal(result.totalDocs, 2, 'One natively authored article per viewport')
      articlesBefore = result.docs
      assert(articlesBefore.every(article => article._status === 'draft'))
      for (const query of ['', '?draft=true']) {
        // Raw fetch has no owner JWT or browser cookies.
        const listing = await fetch(`${origin}/api/articles${query}`, { signal: AbortSignal.timeout(10_000) })
        assert.equal(listing.status, 200)
        const listed = await listing.json()
        assert.equal(listed.totalDocs, 0, 'Anonymous listing must not disclose native drafts')
        assert.deepEqual(listed.docs, [])
        for (const article of articlesBefore) {
          const detail = await fetch(`${origin}/api/articles/${article.id}${query}`, { signal: AbortSignal.timeout(10_000) })
          assert.equal(detail.status, 404, 'Anonymous draft lookup remains hidden, even with draft=true')
          const error = await detail.text()
          assert(!error.includes(article.title) && !error.includes(article.excerpt), 'Denial must not leak draft text')
        }
      }
      const history = await fetch(`${origin}/api/articles/versions`, { signal: AbortSignal.timeout(10_000) })
      assert.equal(history.status, 403, 'Anonymous visitors cannot enumerate article history')
      await history.arrayBuffer()
      console.log('[production-http] anonymous article drafts and version history remain private')
    }
    if (browserEditor) assert.equal(brandIds.length, 2, 'One distinct second-page brand per viewport')
    const brandsBefore = await Promise.all(brandIds.map(async id => {
      const response = await request(`/api/brand-profiles/${id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      return response.json()
    }))
    const placementIds = [...new Set(browserDrafts.flatMap(draft => draft.layout
      .filter(block => block.blockType === 'media').map(block => block.placement)))]
    if (browserEditor) assert.equal(placementIds.length, 2, 'One natively authored placement per viewport')
    const placementsBefore = await Promise.all(placementIds.map(async id => {
      const response = await request(`/api/media-placements/${id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      const doc = await response.json()
      assert.equal(doc.placement.focalX, 1)
      assert.equal(doc.placement.overrides.mobile.zoom, 4)
      assert.equal(doc.placement.overrides.mobile.focalY, 0)
      assert.equal(doc.placement.overrides.mobile.frame, '1:1')
      return doc
    }))
    const anonymous = await fetch(`${origin}/api/owner/system/readiness`, { signal: AbortSignal.timeout(10_000) })
    assert.equal(anonymous.status, 403)
    const readiness = await request('/api/owner/system/readiness')
    assert.equal(readiness.status, 200)
    const readinessState = (await readiness.json()).readiness
    assert.equal(readinessState.productionReady, false)
    if (objectMedia) assert.equal(readinessState.runtime.mediaStorage.kind, 'objects')
    const verifyMediaAfterRestart = objectMedia ? await verifyProductionObjectMedia({ origin, token, environment: objectEnvironment }) : undefined
    const created = await request('/api/pages?draft=true', { method: 'POST', body: JSON.stringify({ title: 'Production HTTP draft', slug: 'production-http-qa', layout: [{ blockType: 'hero', heading: 'Saved over HTTP' }] }) })
    assert.equal(created.status, 201)
    const { doc } = await created.json()
    const edited = await request(`/api/pages/${doc.id}?draft=true`, { method: 'PATCH', body: JSON.stringify({ title: 'Preserved after process restart' }) })
    assert.equal(edited.status, 200)
    const beforeResponse = await request(`/api/pages/${doc.id}?draft=true&depth=0`)
    assert.equal(beforeResponse.status, 200)
    const before = await beforeResponse.json()
    assert.equal(before.title, 'Preserved after process restart', 'The edit must really persist before restart')
    assert.equal(before._status, 'draft')
    const firstPID = app.pid
    await stop()
    await start()
    assert.notEqual(app.pid, firstPID)
    const afterResponse = await request(`/api/pages/${doc.id}?draft=true&depth=0`)
    assert.equal(afterResponse.status, 200)
    assert.deepEqual(await afterResponse.json(), before)
    for (const browserDraft of browserDrafts) {
      const response = await request(`/api/pages/${browserDraft.id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), browserDraft, 'Browser-edited draft survives process restart')
    }
    for (const brand of brandsBefore) {
      const response = await request(`/api/brand-profiles/${brand.id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), brand, 'Related brand survives process restart')
    }
    for (const article of articlesBefore) {
      const response = await request(`/api/articles/${article.id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), article, 'Native article survives process restart')
    }
    for (const project of projectsBefore) {
      const response = await request(`/api/projects/${project.id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), project, 'Browser-edited project survives process restart')
    }
    if (browserEditor) console.log('[production-http] two browser-edited project fixtures preserved after app restart')
    if (browserEditor) console.log('[production-http] two native article drafts preserved after app restart')
    for (const placement of placementsBefore) {
      const response = await request(`/api/media-placements/${placement.id}?draft=true&depth=0`)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), placement, 'Native placement and its recipe survive process restart')
    }
    if (browserEditor) console.log('[production-http] six browser drafts, two related brands and two placements preserved after app restart')
    await verifyMediaAfterRestart?.()
    console.log(JSON.stringify({ productionHTTP: 'passed', browserEditor: browserEditor ? 'passed' : 'not-run', login: true, anonymousDenied: true, draftPreservedAcrossProcessRestart: true, deployment: false }))
  } finally { await stop() }
} catch (error) {
  if (error.childClosed === false) infrastructureClosed = false
  throw error
} finally {
  let providerClosed = false
  try { await objectEnvironment?.close(); providerClosed = true } finally {
    let browserProxyClosed = false
    try { await browserProxy?.close(); browserProxyClosed = true } finally {
      await postgres.shutdown({ childrenClosed: closed && workersClosed() && providerClosed && browserProxyClosed && infrastructureClosed })
    }
  }
  console.log('[production-http] owned app and cluster closed; isolated root cleaned')
}
