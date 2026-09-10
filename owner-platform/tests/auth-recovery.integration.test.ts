import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import type { SendEmailOptions } from 'payload'

vi.mock('server-only', () => ({}))
import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'
import { resolveOwnerServerURL } from '../src/config/server-url'
import { createOwnerEmailAdapter } from '../src/config/email'

let fixture: MediaHTTPFixture
const email = 'recovery-owner@example.invalid'
const password = randomUUID() + randomUUID()
const inbox: SendEmailOptions[] = []
let rejectDelivery = false
beforeEach(() => { inbox.length = 0; rejectDelivery = false })
beforeAll(async () => {
  const directory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit QA directory required')
  const root = path.join(directory, `auth-recovery-${randomUUID()}`)
  fixture = await startMediaHTTPFixture({
    root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'uploads'),
    credentials: { email, password }, secret: randomUUID() + randomUUID(), seed: true,
    database: { engine: 'sqlite', filename: path.join(root, 'auth.db') },
  })
  // Real owner REST adapter; intercept only external delivery, not local REST.
  const nativeFetch = globalThis.fetch
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    if (String(input) !== 'https://api.resend.com/emails') return nativeFetch(input, init)
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
