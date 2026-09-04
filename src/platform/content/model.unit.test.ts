import { describe, expect, it } from 'vitest'

import {
  assertPortfolioDocument,
  normalizeMediaPlacement,
  type PortfolioDocument,
  type MediaPlacement,
} from './model'

const placement: MediaPlacement = {
  assetId: 'asset-cover',
  focalX: 0.25,
  focalY: 0.75,
  zoom: 2,
  fit: 'contain',
  frame: { aspectRatio: 16 / 9 },
  breakpointOverrides: {
    mobile: { focalX: 0.5, zoom: 1.25 },
  },
}

const validDocument = (): PortfolioDocument => ({
  schemaVersion: 1,
  assets: [{ id: 'asset-cover', src: '/images/cover.jpg' }],
  blocks: [
    { id: 'hero', kind: 'hero', order: 0 },
    {
      id: 'cover',
      kind: 'media',
      order: 1,
      assetId: 'asset-cover',
      placement,
    },
  ],
})

describe('normalizeMediaPlacement', () => {
  it('applies safe defaults and returns a fresh placement', () => {
    const input = { assetId: 'asset-1' }

    const result = normalizeMediaPlacement(input)

    expect(result).toEqual({
      assetId: 'asset-1',
      focalX: 0.5,
      focalY: 0.5,
      zoom: 1,
      fit: 'cover',
    })
    expect(result).not.toBe(input)
  })

  it('clamps focal points and zoom without mutating nested placement data', () => {
    const input: MediaPlacement = {
      ...placement,
      focalX: -4,
      focalY: 3,
      zoom: 99,
      breakpointOverrides: { mobile: { focalX: 0.1 } },
    }
    const original = structuredClone(input)

    const result = normalizeMediaPlacement(input)

    expect(result.focalX).toBe(0)
    expect(result.focalY).toBe(1)
    expect(result.zoom).toBe(4)
    expect(result.breakpointOverrides).toEqual(input.breakpointOverrides)
    expect(result.breakpointOverrides).not.toBe(input.breakpointOverrides)
    expect(result.breakpointOverrides?.mobile).not.toBe(input.breakpointOverrides?.mobile)
    expect(result.frame).not.toBe(input.frame)
    result.breakpointOverrides!.mobile!.focalX = 0.9
    result.frame!.aspectRatio = 1
    expect(input.breakpointOverrides?.mobile.focalX).toBe(0.1)
    expect(input.frame?.aspectRatio).toBe(16 / 9)
    expect(input).toEqual(original)
  })

  it('clamps a zoom value below the reversible range', () => {
    expect(normalizeMediaPlacement({ assetId: 'asset-1', zoom: 0 }).zoom).toBe(1)
  })

  it('falls back to cover when an untrusted fit value is supplied', () => {
    expect(normalizeMediaPlacement({ assetId: 'asset-1', fit: 'stretch' }).fit).toBe('cover')
  })

  it('rejects a null breakpoint override with a descriptive TypeError', () => {
    const input = {
      assetId: 'asset-1',
      breakpointOverrides: { mobile: null },
    } as unknown as Parameters<typeof normalizeMediaPlacement>[0]

    expect(() => normalizeMediaPlacement(input)).toThrow(/breakpoint override.*object/i)
  })

  it('rejects malformed breakpoint override values', () => {
    const input = {
      assetId: 'asset-1',
      breakpointOverrides: { mobile: { focalX: 'center' } },
    } as unknown as Parameters<typeof normalizeMediaPlacement>[0]

    expect(() => normalizeMediaPlacement(input)).toThrow(/focalX/i)
  })

  it('rejects a null breakpoint override collection with a TypeError', () => {
    const input = {
      assetId: 'asset-1',
      breakpointOverrides: null,
    } as unknown as Parameters<typeof normalizeMediaPlacement>[0]

    expect(() => normalizeMediaPlacement(input)).toThrow(/breakpointOverrides.*object/i)
  })
})

describe('assertPortfolioDocument', () => {
  it('returns a typed document for a valid modular document', () => {
    const document = validDocument()

    expect(assertPortfolioDocument(document)).toStrictEqual(document)
  })

  it('accepts every supported block kind', () => {
    const document = {
      ...validDocument(),
      blocks: (['hero', 'richText', 'projectGrid', 'media', 'customFeature'] as const).map(
        (kind, order) => ({
          id: kind,
          kind,
          order,
          ...(kind === 'media' ? { assetId: 'asset-cover' } : {}),
        }),
      ),
    }

    expect(assertPortfolioDocument(document)).toStrictEqual(document)
  })

  it('rejects an unsupported block kind', () => {
    const document = validDocument()
    const block = document.blocks[0] as unknown as Record<string, unknown>
    block.kind = 'video'

    expect(() => assertPortfolioDocument(document)).toThrow(/block kind/i)
  })

  it('rejects a non-object document', () => {
    expect(() => assertPortfolioDocument(null)).toThrow(TypeError)
    expect(() => assertPortfolioDocument('document')).toThrow(/object/i)
  })

  it('rejects schema versions other than one', () => {
    expect(() => assertPortfolioDocument({ ...validDocument(), schemaVersion: 2 })).toThrow(
      /schema version.*1/i,
    )
  })

  it('rejects duplicate block IDs', () => {
    const document = validDocument()
    document.blocks[1] = { ...document.blocks[0], id: 'hero' }

    expect(() => assertPortfolioDocument(document)).toThrow(/duplicate.*block.*id/i)
  })

  it.each([
    ['negative', -1],
    ['fractional', 1.5],
    ['non-numeric', '1'],
  ])('rejects %s block order', (_description, order) => {
    const document = validDocument()
    const block = document.blocks[0] as unknown as Record<string, unknown>
    block.order = order

    expect(() => assertPortfolioDocument(document)).toThrow(/order/i)
  })

  it('rejects a media block that references an unknown asset', () => {
    const document = validDocument()
    document.blocks[1] = {
      ...document.blocks[1],
      assetId: 'missing-asset',
    }

    expect(() => assertPortfolioDocument(document)).toThrow(/asset.*missing|missing.*asset/i)
  })

  it('rejects conflicting asset IDs on a media block and its placement', () => {
    const document = validDocument()
    document.assets.push({ id: 'asset-other', src: '/images/other.jpg' })
    document.blocks[1] = {
      ...document.blocks[1],
      assetId: 'asset-cover',
      placement: { ...placement, assetId: 'asset-other' },
    }

    expect(() => assertPortfolioDocument(document)).toThrow(/conflict|different.*asset/i)
  })

  it('rejects malformed nested placement data', () => {
    const document = validDocument()
    const block = document.blocks[1] as unknown as Record<string, unknown>
    block.placement = { ...placement, focalX: 'left' }

    expect(() => assertPortfolioDocument(document)).toThrow(/focalX/i)
  })

  it('rejects null nested breakpoint overrides', () => {
    const document = validDocument()
    const block = document.blocks[1] as unknown as Record<string, unknown>
    block.placement = {
      ...placement,
      breakpointOverrides: { mobile: null },
    }

    expect(() => assertPortfolioDocument(document)).toThrow(/breakpoint override.*object/i)
  })
})
