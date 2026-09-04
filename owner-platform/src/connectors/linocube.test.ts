import { describe, expect, it } from 'vitest'

import { createPreviewManifest, PREVIEW_LIMITS } from '../preview/manifest'
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

  it('rejects extra keys, secrets, malformed source, arrays, and hash fields', () => {
    const valid = { schemaVersion: 1 as const, manifestVersion: 3, digest: manifest.hash, manifest }
    expect(() => validatePublishedManifest({ ...valid, token: 'secret' })).toThrow(/propiedad/i)
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, extra: true } })).toThrow(/propiedad/i)
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, source: { ...manifest.source, extra: true } } })).toThrow(/source|propiedad/i)
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, pageBlocks: {} } })).toThrow(/lista/i)
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, hash: `sha256:${'0'.repeat(64)}` } })).toThrow(/hash|coincide/i)
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, brandTokens: { accessToken: 'secret' } } })).toThrow(/secreta/i)
  })

  it('rejects getters and prototype-backed envelopes', () => {
    const getter = Object.defineProperty({ schemaVersion: 1, manifestVersion: 1, digest: manifest.hash }, 'manifest', { enumerable: true, get: () => manifest })
    expect(() => validatePublishedManifest(getter)).toThrow(/datos planos/i)
    expect(() => validatePublishedManifest(new (class Envelope { schemaVersion = 1; manifestVersion = 1; digest = manifest.hash; manifest = manifest })())).toThrow(/objeto plano/i)
  })

  it('rejects array getters, custom iterators/prototypes, and excessive depth before scanning', () => {
    const valid = { schemaVersion: 1 as const, manifestVersion: 3, digest: manifest.hash, manifest }
    const getterBlocks: unknown[] = []
    Object.defineProperty(getterBlocks, '0', { enumerable: true, get: () => ({ text: 'x' }) })
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, pageBlocks: getterBlocks } })).toThrow(/datos planos/i)
    const iteratorBlocks: unknown[] = []
    Object.defineProperty(iteratorBlocks, Symbol.iterator, { value: function* () { yield* [] } })
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, pageBlocks: iteratorBlocks } })).toThrow(/símbolos/i)
    const prototypeBlocks: unknown[] = []
    Object.setPrototypeOf(prototypeBlocks, {})
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, pageBlocks: prototypeBlocks } })).toThrow(/prototipo/i)
    let deep: Record<string, unknown> = { value: 'x' }
    for (let index = 0; index <= PREVIEW_LIMITS.maxDepth; index += 1) deep = { child: deep }
    expect(() => validatePublishedManifest({ ...valid, manifest: { ...manifest, brandTokens: deep } })).toThrow(/profundidad/i)
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
