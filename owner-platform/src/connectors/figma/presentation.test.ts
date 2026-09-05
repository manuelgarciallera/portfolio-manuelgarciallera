import { describe, expect, it } from 'vitest'

import { presentFigmaDiscovery } from './presentation'

describe('presentFigmaDiscovery', () => {
  it('projects bounded read-only candidate metadata', () => {
    expect(presentFigmaDiscovery({
      ok: true,
      file: { name: 'Portfolio' },
      candidates: [{ id: '1:2', name: 'Hero', type: 'FRAME', width: 1440, height: 900, sourceUrl: 'https://www.figma.com/design/AbC/file?node-id=1-2', preview: { url: 'https://s3-alpha.figma.com/hero.png', expiresAfterDays: 30 } }],
      truncated: false,
    })).toEqual({ fileName: 'Portfolio', candidates: [{ id: '1:2', name: 'Hero', type: 'Frame', dimensions: '1440 × 900', sourceUrl: 'https://www.figma.com/design/AbC/file?node-id=1-2', previewUrl: 'https://s3-alpha.figma.com/hero.png' }], notice: null })
  })

  it('rejects untrusted URLs and caps candidates defensively', () => {
    const candidate = { id: '1:2', name: 'Hero', type: 'FRAME', sourceUrl: 'https://www.figma.com/design/AbC/file' }
    expect(() => presentFigmaDiscovery({ ok: true, file: { name: 'X' }, candidates: [{ ...candidate, sourceUrl: 'javascript:alert(1)' }], truncated: false })).toThrow(/figma/i)
    expect(() => presentFigmaDiscovery({ ok: true, file: { name: 'X' }, candidates: new Array(101).fill(candidate), truncated: true })).toThrow(/figma/i)
  })
})
