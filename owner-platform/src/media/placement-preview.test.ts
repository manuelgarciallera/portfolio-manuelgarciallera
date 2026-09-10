import { describe, expect, it } from 'vitest'

import { buildMediaPlacementPreview, presentPreviewAsset } from './placement-preview'

const fields = (values: Record<string, unknown>) => Object.fromEntries(
  Object.entries(values).map(([path, value]) => [path, { value }]),
)

describe('buildMediaPlacementPreview', () => {
  it('projects desktop placement values into a real-media preview recipe', () => {
    expect(buildMediaPlacementPreview(fields({
      'placement.asset': 12,
      'placement.fit': 'cover',
      'placement.focalX': 0.25,
      'placement.focalY': 0.75,
      'placement.frame': '16:9',
      'placement.zoom': 1.5,
    }), 'desktop')).toEqual({
      assetId: 12,
      aspectRatio: '16 / 9',
      fit: 'cover',
      focalX: 25,
      focalY: 75,
      frame: '16:9',
      zoom: 1.5,
    })
  })

  it('uses a bounded breakpoint override and falls back field-by-field to desktop', () => {
    expect(buildMediaPlacementPreview(fields({
      'placement.asset': 'asset-12',
      'placement.fit': 'cover',
      'placement.focalX': 0.5,
      'placement.focalY': 0.4,
      'placement.frame': '4:3',
      'placement.zoom': 1.2,
      'placement.overrides.mobile.focalX': 0.8,
      'placement.overrides.mobile.frame': '9:16',
      'placement.overrides.mobile.zoom': 2,
    }), 'mobile')).toEqual({
      assetId: 'asset-12',
      aspectRatio: '9 / 16',
      fit: 'cover',
      focalX: 80,
      focalY: 40,
      frame: '9:16',
      zoom: 2,
    })
  })

  it('fails closed for incomplete or out-of-range form drafts', () => {
    expect(buildMediaPlacementPreview(fields({ 'placement.asset': 12, 'placement.zoom': 9 }), 'desktop')).toBeNull()
    expect(buildMediaPlacementPreview(fields({ 'placement.focalX': 0.5 }), 'desktop')).toBeNull()
  })
})

describe('presentPreviewAsset', () => {
  const revision = '12345678-1234-4234-8234-123456789012'
  const versioned = { id: 12, storageRevision: revision, filename: 'portada ñ.png', url: `/api/media/revision/12/${revision}/portada%20%C3%B1.png` }
  it('accepts a canonical local revision URL bound to the selected media metadata', () => {
    expect(presentPreviewAsset(versioned, 12).url).toBe(`/api/media/revision/12/${revision}/portada%20%C3%B1.png`)
  })
  it.each([
    { url: `/api/media/revision/13/${revision}/portada%20%C3%B1.png` },
    { storageRevision: '22345678-1234-4234-8234-123456789012' },
    { filename: 'another.png' },
    { url: `${versioned.url}?download=1` },
    { url: `https://example.com${versioned.url}` },
    { filename: '..', url: `/api/media/revision/12/${revision}/..` },
    { storageRevision: undefined },
  ])('rejects a revision URL not bound to trusted metadata: %j', patch => {
    expect(() => presentPreviewAsset({ ...versioned, ...patch }, 12)).toThrow()
  })
  it('accepts only same-origin uploaded-media paths and bounded metadata', () => {
    expect(presentPreviewAsset({ alt: 'Portada del proyecto', height: 1080, id: 12, url: '/api/media/file/hero.webp', width: 1920 }, 12)).toEqual({
      alt: 'Portada del proyecto',
      height: 1080,
      id: 12,
      url: '/api/media/file/hero.webp',
      width: 1920,
    })
    expect(() => presentPreviewAsset({ id: 12, url: 'https://example.com/hero.webp' }, 12)).toThrow(/medio/i)
    expect(() => presentPreviewAsset({ id: 13, url: '/api/media/file/hero.webp' }, 12)).toThrow(/medio/i)
  })
})
