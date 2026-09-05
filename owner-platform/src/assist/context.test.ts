import { describe, expect, it } from 'vitest'

import { createPreviewManifest } from '../preview/manifest'
import { buildAssistanceContextPackage } from './context'

const manifest = createPreviewManifest({
  source: { collection: 'pages', documentId: 'home', versionId: 'current:2026-09-05T02:00:00.000Z' },
  brandTokens: { colors: [{ role: 'accent', value: '#FF4B44' }], motion: { duration: 600 }, usageWeights: [{ role: 'accent', weight: 100 }] },
  pageBlocks: [{ blockType: 'media', asset: '9', placement: '14', caption: 'Portada' }],
  mediaReferences: [{ id: '9', alt: 'Portada', width: 1600, height: 900 }],
})

describe('assistance context package', () => {
  it('exports only enabled capabilities and immutable verified editorial context', () => {
    const result = buildAssistanceContextPackage(manifest, {
      suggestCopy: true,
      suggestCrop: true,
      suggestLayout: false,
      suggestMotion: true,
      suggestPalette: false,
    })
    expect(result).toEqual({
      schemaVersion: 1,
      contentTrust: 'untrusted-editorial-data',
      snapshot: { hash: manifest.hash, source: manifest.source },
      permissions: { apply: false, capabilities: ['suggestCopy', 'suggestCrop', 'suggestMotion'], deploy: false, publish: false },
      proposalContract: {
        schemaVersion: 1,
        operationLimit: 32,
        outputEnvelope: { schemaVersion: 1, capability: 'one-enabled-capability', operations: [{ op: 'replace', path: 'one-listed-target', value: 'type-compatible-value' }] },
        targetRules: [
          { capability: 'suggestCopy', operation: 'replace', path: '/page/layout/0/caption', value: { maxLength: 4000, type: 'string' } },
          { capability: 'suggestCrop', operation: 'replace', path: '/media-placements/14/placement/focalX', value: { maximum: 1, minimum: 0, type: 'number' } },
          { capability: 'suggestCrop', operation: 'replace', path: '/media-placements/14/placement/focalY', value: { maximum: 1, minimum: 0, type: 'number' } },
          { capability: 'suggestCrop', operation: 'replace', path: '/media-placements/14/placement/zoom', value: { maximum: 4, minimum: 1, type: 'number' } },
          { capability: 'suggestCrop', operation: 'replace', path: '/media-placements/14/placement/fit', value: { enum: ['cover', 'contain'], type: 'string' } },
          { capability: 'suggestCrop', operation: 'replace', path: '/media-placements/14/placement/frame', value: { enum: ['auto', '16:9', '4:3', '1:1', '9:16'], type: 'string' } },
          { capability: 'suggestMotion', operation: 'replace', path: '/brand/motion/duration', value: { maximum: 1600, minimum: 150, type: 'number' } },
        ],
        targets: {
          suggestCopy: ['/page/layout/0/caption'],
          suggestCrop: [
            '/media-placements/14/placement/focalX',
            '/media-placements/14/placement/focalY',
            '/media-placements/14/placement/zoom',
            '/media-placements/14/placement/fit',
            '/media-placements/14/placement/frame',
          ],
          suggestMotion: ['/brand/motion/duration'],
        },
      },
      context: { brand: manifest.brandTokens, media: manifest.mediaReferences, page: { layout: manifest.pageBlocks } },
    })
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.context.page.layout)).toBe(true)
  })

  it('rejects unverified, credential-shaped, and oversized snapshot data', () => {
    expect(() => buildAssistanceContextPackage({ ...manifest, hash: 'sha256:forged' }, {})).toThrow(/hash/i)
    const credential = createPreviewManifest({ ...manifest, brandTokens: { apiToken: 'secret' } } as never)
    expect(() => buildAssistanceContextPackage(credential, {})).toThrow(/sensible/i)
    const oversized = createPreviewManifest({ ...manifest, pageBlocks: [0, 1, 2].map((index) => ({ blockType: 'richText', content: `${index}${'x'.repeat(90_000)}` })) } as never)
    expect(() => buildAssistanceContextPackage(oversized, {})).toThrow(/grande/i)
  })

  it('describes only the palette and layout targets enabled for the current snapshot', () => {
    const result = buildAssistanceContextPackage(manifest, {
      suggestCopy: false,
      suggestCrop: false,
      suggestLayout: true,
      suggestMotion: false,
      suggestPalette: true,
    })

    expect(result.proposalContract.targets).toEqual({
      suggestPalette: ['/brand/colors/0/value', '/brand/usageWeights/0/weight'],
      suggestLayout: ['/page/layout'],
    })
    expect(result.proposalContract.targetRules).toEqual([
      { capability: 'suggestPalette', operation: 'replace', path: '/brand/colors/0/value', value: { format: '#RRGGBB', type: 'string' } },
      { capability: 'suggestPalette', operation: 'replace', path: '/brand/usageWeights/0/weight', value: { atomicSet: true, maximum: 100, minimum: 0, total: 100, type: 'number' } },
      { capability: 'suggestLayout', operation: 'replace', path: '/page/layout', value: { constraint: 'exact-block-reorder', type: 'array' } },
    ])
  })
})
