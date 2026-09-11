import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import type { SendEmailOptions } from 'payload'
import { createLocalReq } from 'payload'
import { lockRecoveryToken } from '../src/auth/recovery-lock'
import type { PostgresAdapter } from '@payloadcms/db-postgres'

vi.mock('server-only', () => ({}))
import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'
import { resolveOwnerServerURL } from '../src/config/server-url'
import { createOwnerEmailAdapter } from '../src/config/email'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'

let fixture: MediaHTTPFixture
const email = 'recovery-owner@example.invalid'
const password = randomUUID() + randomUUID()
const inbox: SendEmailOptions[] = []
let rejectDelivery = false
let deliveryAttempts = 0
const admissionTable = '"versioned_media_http_fixture"."owner_recovery_admissions"'
const admissionPool = () => (fixture.payload.db as unknown as PostgresAdapter).pool
beforeEach(async () => {
  inbox.length = 0; rejectDelivery = false; deliveryAttempts = 0
  if (fixture.payload.db.name === 'postgres') await admissionPool().query(`TRUNCATE TABLE ${admissionTable}`)
})
// Only synthetic persisted timestamps are aged; the real database clock remains
// authoritative. This lets native supersession/outage tests request a later link.
const expireCooldown = async () => {
  if (fixture.payload.db.name === 'postgres') await admissionPool().query(`UPDATE ${admissionTable} SET last_admitted_at = clock_timestamp() - interval '61 seconds' WHERE key LIKE 'r:%'`)
}
beforeAll(async () => {
  const directory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit QA directory required')
  const root = path.join(directory, `auth-recovery-${randomUUID()}`)
  const selected = await editorialDatabaseConfig(process.env, {
    cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)),
  })
  fixture = await startMediaHTTPFixture({
    root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'uploads'),
    credentials: { email, password }, secret: randomUUID() + randomUUID(), seed: true,
    database: selected.engine === 'postgres'
      ? { engine: 'postgres', pool: selected.pool }
      : { engine: 'sqlite', filename: path.join(root, 'auth.db') },
  })
  expect(fixture.payload.db.name).toBe(process.env.OWNER_INTEGRATION_ENGINE === 'postgres' ? 'postgres' : 'sqlite')
  // Real owner REST adapter; intercept only external delivery, not local REST.
  const nativeFetch = globalThis.fetch
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    if (String(input) !== 'https://api.resend.com/emails') return nativeFetch(input, init)
    deliveryAttempts++
    if (rejectDelivery) return Response.json({ name: 'provider_error', message: 'sensitive-provider-detail', statusCode: 503 }, { status: 503 })
    inbox.push(JSON.parse(String(init?.body)))
    return Response.json({ id: randomUUID() })
  })
  fixture.payload.email = createOwnerEmailAdapter({ apiKey: 're_synthetic_test_only', fromAddress: 'cms@example.invalid' })({ payload: fixture.payload })
  fixture.payload.config.serverURL = resolveOwnerServerURL({ value: fixture.origin, nodeEnv: 'test' })!
}, 60_000)

it('rejects superseded and expired recovery links without changing the password', async () => {
  const targetEmail = 'second-owner@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  const requestToken = async () => {
    expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
    const href = String(inbox.at(-1)?.html).match(/href="([^"]+)"/)?.[1]
    return new URL(href!).pathname.split('/').at(-1)!
  }
  const older = await requestToken()
  await expireCooldown()
  const newer = await requestToken()
  expect(older).not.toBe(newer)
  const replacement = randomUUID() + randomUUID()
  expect((await post('reset-password', { token: older, password: replacement })).status).toBe(403)
  // Expire the persisted real token without waiting an hour or mocking the clock.
  await fixture.payload.update({ collection: 'users', id: user.id, overrideAccess: true,
    data: { resetPasswordExpiration: '2000-01-01T00:00:00.000Z' } })
  expect((await post('reset-password', { token: newer, password: replacement })).status).toBe(403)
  expect((await post('login', { email: targetEmail, password: targetPassword })).status).toBe(200)
}, 60_000)
afterAll(async () => { try { await fixture?.close() } finally { vi.unstubAllGlobals() } })
const post = (route: string, data: unknown) => fixture.request(`/api/users/${route}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
}, false)

it('recovers through the emailed single-use token without exposing account existence', async () => {
  const known = await post('forgot-password', { email })
  expect(known.status).toBe(200)
  expect(inbox).toHaveLength(1)
  expect(inbox[0].to).toBe(email)
  const html = String(inbox[0].html)
  const href = html.match(/href="([^"]+)"/)?.[1]
  expect(href).toBeTruthy()
  const link = new URL(href!)
  expect(link.origin).toBe(fixture.origin)
  expect(link.pathname).toMatch(/^\/admin\/reset\/[a-f0-9]+$/)
  const token = link.pathname.split('/').at(-1)!
  const unknown = await post('forgot-password', { email: 'absent@example.invalid' })
  expect(unknown.status).toBe(known.status)
  expect(await unknown.json()).toEqual(await known.json())
  expect(inbox).toHaveLength(1)
  const nextPassword = randomUUID() + randomUUID()
  expect((await post('reset-password', { token: 'not-valid', password: nextPassword })).status).toBe(403)
  expect((await post('reset-password', { token, password: nextPassword })).status).toBe(200)
  expect((await post('login', { email, password })).status).toBe(401)
  expect((await post('login', { email, password: nextPassword })).status).toBe(200)
  expect((await post('reset-password', { token, password })).status).toBe(403)
}, 60_000)

it('rolls back a rejected delivery and preserves the previously issued recovery link', async () => {
  const targetEmail = 'delivery-failure@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  const stored = () => fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
  const before = await stored()
  expect(typeof before.resetPasswordToken).toBe('string')
  rejectDelivery = true
  await expect(fixture.payload.forgotPassword({ collection: 'users', data: { email: targetEmail } })).rejects.toThrow('Owner email delivery failed')
  await expireCooldown()
  const failed = await post('forgot-password', { email: targetEmail })
  const unknown = await post('forgot-password', { email: 'absent-during-outage@example.invalid' })
  expect(failed.status).toBe(200)
  const body = await failed.text()
  expect(body).toBe(await unknown.text())
  expect(failed.headers.get('cache-control')).toBe('no-store')
  expect(body).not.toContain('sensitive-provider-detail')
  expect(body).not.toContain(targetEmail)
  const after = await stored()
  expect(after.resetPasswordToken).toBe(before.resetPasswordToken)
  expect(after.resetPasswordExpiration).toBe(before.resetPasswordExpiration)
  expect(inbox).toHaveLength(1)
  expect((await post('login', { email: targetEmail, password: targetPassword })).status).toBe(200)
  const replacement = randomUUID() + randomUUID()
  expect((await post('reset-password', { token: before.resetPasswordToken, password: replacement })).status).toBe(200)
  expect((await post('login', { email: targetEmail, password: replacement })).status).toBe(200)
}, 60_000)

it('does not disguise malformed recovery requests as accepted delivery requests', async () => {
  expect((await post('forgot-password', {})).status).toBe(400)
  expect((await post('forgot-password', { email: { injected: true } })).status).toBe(400)
})

// Production requires PostgreSQL. SQLite retains the native local-only path.
it.runIf(process.env.OWNER_INTEGRATION_ENGINE === 'postgres')('accepts a recovery token only once when two PostgreSQL resets arrive concurrently', async () => {
  const targetEmail = 'concurrent-reset@example.invalid'
  const originalPassword = randomUUID() + randomUUID()
  await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: originalPassword, role: 'owner' } })
  expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
  const link = String(inbox.at(-1)?.html).match(/href="([^"]+)"/)?.[1]
  const token = new URL(link!).pathname.split('/').at(-1)!
  const passwords = [randomUUID() + randomUUID(), randomUUID() + randomUUID()]
  const responses = await Promise.all(passwords.map(password => post('reset-password', { token, password })))
  expect(responses.map(response => response.status).sort()).toEqual([200, 403])
  const winner = responses.findIndex(response => response.status === 200)
  expect((await post('login', { email: targetEmail, password: passwords[winner] })).status).toBe(200)
  expect((await post('login', { email: targetEmail, password: passwords[1 - winner] })).status).toBe(401)
  expect((await post('reset-password', { token, password: originalPassword })).status).toBe(403)
}, 60_000)

it.runIf(process.env.OWNER_INTEGRATION_ENGINE === 'postgres').each(['commit', 'rollback'] as const)('rejects a separately locked token until its transaction releases by %s', async release => {
  const targetEmail = `held-token-${release}@example.invalid`
  const password = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password, role: 'owner' } })
  expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
  const stored = () => fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  const before = await stored()
  const req = await createLocalReq({}, fixture.payload)
  const transactionID = await fixture.payload.db.beginTransaction()
  expect(transactionID).toBeTruthy()
  req.transactionID = transactionID!
  let released = false
  try {
    await lockRecoveryToken(req, before.resetPasswordToken)
    const nextPassword = randomUUID() + randomUUID()
    expect((await post('reset-password', { token: before.resetPasswordToken, password: nextPassword })).status).toBe(403)
    const rejected = await stored()
    for (const key of ['hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'sessions'] as const) {
      expect(rejected[key]).toEqual(before[key])
    }
    if (release === 'commit') await fixture.payload.db.commitTransaction(transactionID!)
    else await fixture.payload.db.rollbackTransaction(transactionID!)
    released = true
    expect((await post('reset-password', { token: before.resetPasswordToken, password: nextPassword })).status).toBe(200)
    expect((await post('login', { email: targetEmail, password: nextPassword })).status).toBe(200)
  } finally {
    if (!released) await fixture.payload.db.rollbackTransaction(transactionID!)
  }
}, 60_000)

it('revokes previous sessions on recovery but preserves ordinary concurrent logins and the new session', async () => {
  const targetEmail = 'session-owner@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  const loginToken = async () => {
    const response = await post('login', { email: targetEmail, password: targetPassword })
    expect(response.status).toBe(200)
    return (await response.json()).token as string
  }
  const first = await loginToken()
  const second = await loginToken()
  const me = async (token: string) => (await (await fixture.request('/api/users/me', { headers: { Authorization: `JWT ${token}` } }, false)).json()).user
  expect(await me(first)).toMatchObject({ email: targetEmail })
  expect(await me(second)).toMatchObject({ email: targetEmail })
  expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
  const link = String(inbox.at(-1)?.html).match(/href="([^"]+)"/)?.[1]
  const token = new URL(link!).pathname.split('/').at(-1)!
  const response = await post('reset-password', { token, password: randomUUID() + randomUUID() })
  expect(response.status).toBe(200)
  const newToken = (await response.json()).token
  expect(await me(first)).toBeNull()
  expect(await me(second)).toBeNull()
  expect(await me(newToken)).toMatchObject({ email: targetEmail })
}, 60_000)

it('unlocks a locked account only after a valid recovery token', async () => {
  const targetEmail = 'locked-recovery@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  const stored = () => fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  for (let i = 0; i < 5; i++) expect((await post('login', { email: targetEmail, password: 'wrong' })).status).toBe(401)
  const locked = await stored()
  expect(Number(locked.loginAttempts)).toBeGreaterThanOrEqual(5)
  expect(new Date(String(locked.lockUntil)).getTime()).toBeGreaterThan(Date.now())
  expect((await post('login', { email: targetEmail, password: targetPassword })).status).toBe(401)
  const nextPassword = randomUUID() + randomUUID()
  expect((await post('reset-password', { token: 'invalid', password: nextPassword })).status).toBe(403)
  expect((await stored()).lockUntil).toBe(locked.lockUntil)
  expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
  const link = String(inbox.at(-1)?.html).match(/href="([^"]+)"/)?.[1]
  const token = new URL(link!).pathname.split('/').at(-1)!
  expect((await post('reset-password', { token, password: nextPassword })).status).toBe(200)
  const recovered = await stored()
  expect(recovered.loginAttempts).toBe(0)
  expect(recovered.lockUntil == null).toBe(true)
  expect((await post('login', { email: targetEmail, password: nextPassword })).status).toBe(200)
}, 60_000)

it('rolls back password and session changes when recovery fails after persistence', async () => {
  const targetEmail = 'late-failure@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  const login = await post('login', { email: targetEmail, password: targetPassword })
  expect(login.status).toBe(200)
  const existingJWT = (await login.json()).token as string
  expect((await post('forgot-password', { email: targetEmail })).status).toBe(200)
  const stored = () => fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  const before = await stored()
  const nextPassword = randomUUID() + randomUUID()
  // Native reset has persisted the new hash and session before beforeLogin.
  // Inject only this downstream failure; keep real DB transactions and our hooks.
  const hooks = fixture.payload.collections.users.config.hooks
  const original = hooks.beforeLogin
  let reached = false
  let changedHash = false
  let changedSessions = false
  hooks.beforeLogin = [...(original ?? []), async ({ req }) => {
    reached = true
    const pending = await req.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true, req })
    changedHash = pending.hash !== before.hash
    changedSessions = JSON.stringify(pending.sessions) !== JSON.stringify(before.sessions)
    throw new Error('Synthetic post-write recovery failure')
  }]
  try {
    expect((await post('reset-password', { token: before.resetPasswordToken, password: nextPassword })).status).toBe(500)
    expect(reached).toBe(true)
    expect(changedHash).toBe(true)
    expect(changedSessions).toBe(true)
  } finally { hooks.beforeLogin = original }
  const after = await stored()
  for (const key of ['hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'sessions', 'loginAttempts', 'lockUntil'] as const) {
    expect(after[key]).toEqual(before[key])
  }
  const me = await fixture.request('/api/users/me', { headers: { Authorization: `JWT ${existingJWT}` } }, false)
  expect((await me.json()).user).toMatchObject({ email: targetEmail })
  expect((await post('login', { email: targetEmail, password: targetPassword })).status).toBe(200)
  expect((await post('reset-password', { token: before.resetPasswordToken, password: nextPassword })).status).toBe(200)
  expect((await post('login', { email: targetEmail, password: nextPassword })).status).toBe(200)
}, 60_000)

it.runIf(process.env.OWNER_INTEGRATION_ENGINE === 'postgres')('limits repeated HTTP recovery without replacing the existing link or exposing account existence', async () => {
  const targetEmail = 'limited-http@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  const first = await post('forgot-password', { email: targetEmail })
  expect(first.status).toBe(200)
  const before = await fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  const limited = await post('forgot-password', { email: targetEmail })
  const unknown = await post('forgot-password', { email: 'limited-unknown@example.invalid' })
  expect(limited.status).toBe(200)
  expect(unknown.status).toBe(200)
  const receipt = await first.text()
  expect(await limited.text()).toBe(receipt)
  expect(await unknown.text()).toBe(receipt)
  expect(limited.headers.get('cache-control')).toBe('no-store')
  expect(inbox).toHaveLength(1)
  const after = await fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  for (const key of ['hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'sessions', 'loginAttempts', 'lockUntil'] as const) {
    expect(after[key]).toEqual(before[key])
  }
  expect((await post('login', { email: targetEmail, password: targetPassword })).status).toBe(200)
  expect((await post('reset-password', { token: before.resetPasswordToken, password: randomUUID() + randomUUID() })).status).toBe(200)
}, 60_000)

it.runIf(process.env.OWNER_INTEGRATION_ENGINE === 'postgres')('does not refund HTTP admission after a provider failure and preserves the previous token', async () => {
  const targetEmail = 'outage-budget@example.invalid'
  const targetPassword = randomUUID() + randomUUID()
  const user = await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: targetPassword, role: 'owner' } })
  // Trusted local API creates an older link without consuming this HTTP budget.
  await fixture.payload.forgotPassword({ collection: 'users', data: { email: targetEmail } })
  const before = await fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  expect(deliveryAttempts).toBe(1)
  rejectDelivery = true
  const failed = await post('forgot-password', { email: targetEmail })
  expect(failed.status).toBe(200)
  expect(deliveryAttempts).toBe(2)
  const limited = await post('forgot-password', { email: targetEmail })
  expect(limited.status).toBe(200)
  expect(await limited.text()).toBe(await failed.text())
  expect(deliveryAttempts).toBe(2)
  const row = (await admissionPool().query(`SELECT attempts FROM ${admissionTable} WHERE key LIKE 'r:%'`)).rows
  expect(row).toEqual([{ attempts: 1 }])
  const after = await fixture.payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  expect(after.resetPasswordToken).toBe(before.resetPasswordToken)
  expect(after.resetPasswordExpiration).toBe(before.resetPasswordExpiration)
  expect((await post('reset-password', { token: before.resetPasswordToken, password: randomUUID() + randomUUID() })).status).toBe(200)
}, 60_000)

it.runIf(process.env.OWNER_INTEGRATION_ENGINE === 'postgres')('fails closed over HTTP when admission storage is missing without revealing an account', async () => {
  await admissionPool().query(`ALTER TABLE ${admissionTable} RENAME TO admission_unavailable_fixture`)
  try {
    const known = await post('forgot-password', { email })
    const unknown = await post('forgot-password', { email: 'unknown-db-outage@example.invalid' })
    expect(known.status).toBe(503)
    expect(unknown.status).toBe(503)
    expect(await known.text()).toBe(await unknown.text())
    expect(known.headers.get('cache-control')).toBe('no-store')
    expect(deliveryAttempts).toBe(0)
  } finally {
    await admissionPool().query('ALTER TABLE "versioned_media_http_fixture"."admission_unavailable_fixture" RENAME TO owner_recovery_admissions')
  }
  expect((await post('forgot-password', { email })).status).toBe(200)
  expect(deliveryAttempts).toBe(1)
})

it.runIf(process.env.OWNER_INTEGRATION_ENGINE === 'postgres')('shares normalized recipient budget and ignores spoofed forwarding headers', async () => {
  const targetEmail = 'canonical-recovery@example.invalid'
  await fixture.payload.create({ collection: 'users', overrideAccess: true,
    data: { email: targetEmail, password: randomUUID() + randomUUID(), role: 'owner' } })
  expect((await post('forgot-password', { email: '  CANONICAL-RECOVERY@EXAMPLE.INVALID ' })).status).toBe(200)
  const result = await fixture.request('/api/users/forgot-password', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.12', 'X-Real-IP': '192.0.2.13' },
    body: JSON.stringify({ email: targetEmail }),
  }, false)
  expect(result.status).toBe(200)
  expect(deliveryAttempts).toBe(1)
  expect(inbox[0].to).toBe(targetEmail)
})
