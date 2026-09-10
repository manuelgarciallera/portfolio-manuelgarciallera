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
beforeEach(() => { inbox.length = 0 })
beforeAll(async () => {
  const directory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit QA directory required')
  const root = path.join(directory, `auth-recovery-${randomUUID()}`)
  fixture = await startMediaHTTPFixture({
    root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'uploads'),
    credentials: { email, password }, secret: randomUUID() + randomUUID(), seed: true,
    database: { engine: 'sqlite', filename: path.join(root, 'auth.db') },
  })
  // Real owner/official adapter; intercept only external delivery, not local REST.
  const nativeFetch = globalThis.fetch
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    if (String(input) !== 'https://api.resend.com/emails') return nativeFetch(input, init)
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
