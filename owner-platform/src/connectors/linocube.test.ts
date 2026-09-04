import { describe, expect, it } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { createDisabledLinocubeConsumer, validatePublishedManifest } from './linocube'

const manifest = createPreviewManifest({
  source: { collection: 'pages', documentId: 'page-1', versionId: 'version-2' },
  brandTokens: { accent: '#ff00aa' },
  pageBlocks: [],
  mediaReferences: [],
})

describe('Linocube published manifest contract', () => {
  it('validates a versioned manifest and matching digest', () => {
    const envelope = { schemaVersion: 1 as const, manifestVersion: 3, digest: manifest.hash, manifest }
    expect(validatePublishedManifest(envelope)).toEqual(envelope)
  })

  it('rejects unsupported versions and malformed or mismatched digests', () => {
    expect(() => validatePublishedManifest({ schemaVersion: 2, manifestVersion: 1, digest: manifest.hash, manifest })).toThrow(/schema/i)
    expect(() => validatePublishedManifest({ schemaVersion: 1, manifestVersion: 0, digest: manifest.hash, manifest })).toThrow(/versión/i)
    expect(() => validatePublishedManifest({ schemaVersion: 1, manifestVersion: 1, digest: 'sha256:no', manifest })).toThrow(/digest/i)
    expect(() => validatePublishedManifest({ schemaVersion: 1, manifestVersion: 1, digest: `sha256:${'0'.repeat(64)}`, manifest })).toThrow(/coincide/i)
  })

  it('is disabled by default and never attempts network access', async () => {
    const consumer = createDisabledLinocubeConsumer()
    expect(consumer.enabled).toBe(false)
    await expect(consumer.consume({ schemaVersion: 1, manifestVersion: 1, digest: manifest.hash, manifest })).resolves.toEqual({ ok: false, code: 'disabled' })
  })

  it('returns an immutable envelope copy after validating the digest', () => {
    const input = { schemaVersion: 1 as const, manifestVersion: 3, digest: manifest.hash, manifest }
    const validated = validatePublishedManifest(input)
    input.manifestVersion = 4
    expect(validated.manifestVersion).toBe(3)
    expect(Object.isFrozen(validated)).toBe(true)
  })
})
