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
})
