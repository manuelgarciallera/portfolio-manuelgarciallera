import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import type { Config } from 'payload'
vi.mock('server-only', () => ({}))
import { Media } from '../collections/Media'
import { configureMediaStorage } from './media-storage'

let scratch: string
beforeAll(async () => { scratch = await mkdtemp(path.join(tmpdir(), 'owner-storage-config-')) })
afterAll(async () => { if (scratch) await rm(scratch, { recursive: true, force: true }) })
const config = { collections: [{ ...Media, admin: { ...Media.admin, group: 'Diseño y medios' } }] } as Config
const settings = () => ({ NODE_ENV: 'test', OWNER_MEDIA_MODE: 'objects', OWNER_MEDIA_ENDPOINT: 'http://127.0.0.1:12345',
  OWNER_MEDIA_REGION: 'auto', OWNER_MEDIA_BUCKET: 'test-bucket', OWNER_MEDIA_PREFIX: 'cms-media',
  OWNER_MEDIA_ACCESS_KEY_ID: 'synthetic-key', OWNER_MEDIA_SECRET_ACCESS_KEY: 'synthetic-secret',
  OWNER_MEDIA_SCRATCH_DIR: scratch, OWNER_SERVER_URL: 'http://127.0.0.1:12346' })

it('preserves the legacy configuration when object storage is not requested', async () => {
  expect(await configureMediaStorage(config, {})).toBe(config)
})
it('binds object-backed media without mutating the raw collection or exposing credentials in config data', async () => {
  const bound = await configureMediaStorage(config, settings())
  const media = bound.collections!.find(collection => collection.slug === 'media')!
  expect(media.upload).toMatchObject({ disableLocalStorage: true, staticDir: scratch })
  expect(media.admin?.group).toBe('Diseño y medios')
  expect(media.fields.some(field => 'name' in field && field.name === 'storageRevision')).toBe(true)
  expect(media.endpoints).toEqual(expect.arrayContaining([expect.objectContaining({ path: '/snapshot/:snapshotId/:mediaId' })]))
  expect(JSON.stringify(bound)).not.toContain('synthetic-secret')
  expect(Media.fields.some(field => 'name' in field && field.name === 'storageRevision')).toBe(false)
}, 15_000) // Includes first-time dynamic imports of the real SDK and Payload binding.
it.each(['OWNER_MEDIA_ENDPOINT', 'OWNER_MEDIA_REGION', 'OWNER_MEDIA_BUCKET', 'OWNER_MEDIA_PREFIX', 'OWNER_MEDIA_ACCESS_KEY_ID', 'OWNER_MEDIA_SECRET_ACCESS_KEY', 'OWNER_MEDIA_SCRATCH_DIR', 'OWNER_SERVER_URL'])('rejects missing %s rather than falling back to local storage', async key => {
  await expect(configureMediaStorage(config, { ...settings(), [key]: '' })).rejects.toThrow(/media storage configuration/i)
})
it.each(['typo', 'local', 'objects '])('rejects unknown storage mode %s', async mode => {
  await expect(configureMediaStorage(config, { ...settings(), OWNER_MEDIA_MODE: mode })).rejects.toThrow(/media storage configuration/i)
})
it('does not silently ignore object credentials without an explicit mode', async () => {
  await expect(configureMediaStorage(config, { OWNER_MEDIA_ACCESS_KEY_ID: 'synthetic' })).rejects.toThrow(/media storage configuration/i)
})
it.each(['http://untrusted.example', 'https://user:secret@example.com', 'https://example.com/path', 'https://example.com?x=1', 'https://example.com#fragment'])('rejects noncanonical endpoint %s', async endpoint => {
  await expect(configureMediaStorage(config, { ...settings(), OWNER_MEDIA_ENDPOINT: endpoint })).rejects.toThrow(/media storage configuration/i)
})
it('rejects plaintext loopback provider configuration in production', async () => {
  await expect(configureMediaStorage(config, { ...settings(), NODE_ENV: 'production' })).rejects.toThrow(/media storage configuration/i)
})
it('rejects a nonexistent scratch directory without creating it', async () => {
  await expect(configureMediaStorage(config, { ...settings(), OWNER_MEDIA_SCRATCH_DIR: path.join(scratch, 'missing') })).rejects.toThrow()
})
it('selects object storage in the exported application configuration', async () => {
  vi.resetModules()
  for (const [key, value] of Object.entries({ ...settings(), DATABASE_URL: '', PAYLOAD_SECRET: 'synthetic-config-selection-secret-not-for-runtime' })) vi.stubEnv(key, value)
  try {
    const application = await (await import('../payload.config')).default
    expect(application.collections.find(collection => collection.slug === 'media')?.upload).toMatchObject({ disableLocalStorage: true })
  } finally { vi.unstubAllEnvs(); vi.resetModules() }
}, 30_000)
