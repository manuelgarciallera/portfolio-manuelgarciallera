import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'

let fixture: MediaHTTPFixture
beforeAll(async () => {
  const directory = process.env.OWNER_INTEGRATION_DIRECTORY
  if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit QA directory required')
  const root = path.join(directory, `auth-unlock-${randomUUID()}`)
  fixture = await startMediaHTTPFixture({
    root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'uploads'),
    credentials: { email: 'unlock-owner@example.invalid', password: randomUUID() + randomUUID() },
    secret: randomUUID() + randomUUID(), seed: true,
    database: { engine: 'sqlite', filename: path.join(root, 'auth.db') },
    // A real foreign authentication identity, never added to the production schema.
    collections: [{ slug: 'outsiders', auth: true, fields: [] }],
  })
}, 60_000)
afterAll(async () => { await fixture?.close() })

const post = (url: string, data: unknown, owner = false, headers: Record<string, string> = {}) =>
  fixture.request(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data),
  }, owner)

// Catches removing Users.access.unlock or accepting any authenticated collection.
it('keeps a locked account locked after unauthorized REST unlocks and permits owner recovery', async () => {
  const email = 'locked-target@example.invalid'
  const password = randomUUID() + randomUUID()
  const target = await fixture.payload.create({
    collection: 'users', overrideAccess: true, data: { email, password, role: 'owner' },
  })
  const stored = () => fixture.payload.findByID({
    collection: 'users', id: target.id, overrideAccess: true, showHiddenFields: true,
  })
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await post('/api/users/login', { email, password: 'incorrect-synthetic-password' })
    expect(response.status).toBe(401)
  }
  const locked = await stored()
  expect(locked.loginAttempts).toBeGreaterThanOrEqual(5)
  expect(new Date(locked.lockUntil as string).getTime()).toBeGreaterThan(Date.now())
  expect((await post('/api/users/login', { email, password })).status).toBe(401)

  const outsiderEmail = 'outsider@example.invalid'
  expect((await post('/api/outsiders', { email: outsiderEmail, password }, true)).status).toBe(201)
  const login = await post('/api/outsiders/login', { email: outsiderEmail, password })
  expect(login.status).toBe(200)
  const { token } = await login.json()
  expect(typeof token).toBe('string')
  const identity = await fixture.request('/api/outsiders/me', {
    headers: { Authorization: `JWT ${token}` },
  }, false)
  expect(identity.status).toBe(200)
  expect((await identity.json()).user).toMatchObject({ email: outsiderEmail, collection: 'outsiders' })

  const identities: Record<string, string>[] = [{}, { Authorization: `JWT ${token}` }]
  for (const headers of identities) {
    const response = await post('/api/users/unlock', { email, overrideAccess: true, role: 'owner' }, false, headers)
    expect(response.status).toBe(403)
    const stillLocked = await stored()
    expect(stillLocked.loginAttempts).toBe(locked.loginAttempts)
    expect(stillLocked.lockUntil).toBe(locked.lockUntil)
    expect((await post('/api/users/login', { email, password })).status).toBe(401)
  }

  expect((await post('/api/users/unlock', { email }, true)).status).toBe(200)
  const unlocked = await stored()
  expect(unlocked.loginAttempts).toBe(0)
  expect(unlocked.lockUntil == null).toBe(true)
  expect((await post('/api/users/login', { email, password })).status).toBe(200)
}, 60_000)
