import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createPostgresCluster, preflightTools, runCommand, safeEnvironment } from '../tests/recovery/postgres-runtime.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'
import { verifyProductionBrowserLogin } from '../tests/production/browser-login.mjs'

const cwd = fileURLToPath(new URL('../', import.meta.url))
const next = path.join(cwd, 'node_modules/next/dist/bin/next')
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
await runCommand(process.execPath, [next, 'build'], { cwd, env, timeout: 600_000, secrets: [secret] })
const postgres = await createPostgresCluster({ cache: path.join(cwd, 'node_modules/.cache'), kind: 'recovery', tools })
let app
let closed = true
let closePromise
try {
  const pool = await postgres.initialize()
  const worker = path.join(postgres.root, 'production-seed.mjs')
  await build({ absWorkingDir: cwd, bundle: true, entryPoints: [path.join(cwd, 'tests/production/seed-worker.mjs')],
    outfile: worker, format: 'esm', platform: 'node', packages: 'external' })
  const credentials = { email: `production-${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') }
  await runWorker(worker, { mode: 'seed', postgres: pool, payloadSecret: secret, credentials }, cwd)
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
    // Drain, do not expose runtime diagnostics that could include private config.
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
    await verifyProductionBrowserLogin(origin, credentials)
    const login = await fetch(`${origin}/api/users/login`, { signal: AbortSignal.timeout(10_000), method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
    assert.equal(login.status, 200, 'Owner login over production HTTP')
    const { token } = await login.json()
    assert.equal(typeof token, 'string')
    const request = (route, options = {}) => fetch(origin + route, { ...options, signal: AbortSignal.timeout(10_000), headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json', ...options.headers } })
    const anonymous = await fetch(`${origin}/api/owner/system/readiness`, { signal: AbortSignal.timeout(10_000) })
    assert.equal(anonymous.status, 403)
    const readiness = await request('/api/owner/system/readiness')
    assert.equal(readiness.status, 200)
    assert.equal((await readiness.json()).readiness.productionReady, false)
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
    console.log(JSON.stringify({ productionHTTP: 'passed', login: true, anonymousDenied: true, draftPreservedAcrossProcessRestart: true, deployment: false }))
  } finally { await stop() }
} finally {
  await postgres.shutdown({ childrenClosed: closed && workersClosed() })
  console.log('[production-http] owned app and cluster closed; isolated root cleaned')
}
