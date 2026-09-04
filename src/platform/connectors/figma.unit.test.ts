import { describe, expect, it } from 'vitest'

import {
  createFigmaImportProposal,
  parseFigmaUrl,
  type FigmaNodeCandidate,
} from './figma'

const sourceUrl = 'https://www.figma.com/design/file_123/Portfolio?node-id=12-34#overview'

const candidate = (overrides: Partial<FigmaNodeCandidate> = {}): FigmaNodeCandidate => ({
  nodeId: '1:1',
  name: 'Untitled frame',
  width: 1600,
  height: 900,
  source: {
    provider: 'figma',
    fileKey: 'file_123',
    sourceUrl,
  },
  ...overrides,
})

describe('parseFigmaUrl', () => {
  it.each([
    ['design', 'https://figma.com/design/file_123/Portfolio'],
    ['www design', 'https://www.figma.com/design/file_123/Portfolio'],
    ['file', 'https://www.figma.com/file/file_123/Portfolio'],
    ['prototype', 'https://www.figma.com/proto/file_123/Portfolio'],
  ])('accepts an HTTPS %s URL and extracts its file key', (_name, input) => {
    expect(parseFigmaUrl(input)).toMatchObject({
      fileKey: 'file_123',
      sourceUrl: input,
    })
  })

  it('normalizes hyphenated node IDs and strips hash and unrelated query data', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/design/file_123/Portfolio?utm_source=mail&node-id=12-34#canvas',
    )

    expect(result).toEqual({
      fileKey: 'file_123',
      nodeId: '12:34',
      sourceUrl: 'https://www.figma.com/design/file_123/Portfolio?node-id=12%3A34',
    })
  })

  it('preserves an already colon-delimited node ID', () => {
    expect(parseFigmaUrl('https://figma.com/file/key-1/Name?node-id=99%3A101').nodeId).toBe('99:101')
  })

  it.each([
    'http://www.figma.com/design/file_123/Portfolio',
    'https://evil.example/design/file_123/Portfolio',
    'https://www.figma.com.evil.example/design/file_123/Portfolio',
    'https://user@www.figma.com/design/file_123/Portfolio',
    'https://www.figma.com:8443/design/file_123/Portfolio',
    'https://www.figma.com/design/file%20123/Portfolio',
    'https://www.figma.com/design//Portfolio',
    'https://www.figma.com/design/file_123/Portfolio?node-id=foo',
    'https://www.figma.com/design/file_123/Portfolio?node-id=12-34-56',
    'not a URL',
    'https://www.figma.com/community/file_123/Portfolio',
  ])('rejects unsafe or malformed URL %s', (input) => {
    expect(() => parseFigmaUrl(input)).toThrow(TypeError)
  })
})

describe('createFigmaImportProposal', () => {
  it('normalizes names with locale-independent lowercasing', () => {
    const original = String.prototype.toLocaleLowerCase
    String.prototype.toLocaleLowerCase = () => {
      throw new Error('locale-dependent normalization is not allowed')
    }

    try {
      const result = createFigmaImportProposal({
        sourceUrl,
        targetName: 'Homepage Hero',
        candidates: [candidate({ name: 'homepage hero' })],
      })

      expect(result.reasons).toContain('Exact normalized name match.')
    } finally {
      String.prototype.toLocaleLowerCase = original
    }
  })

  it('does not give an empty normalized name a partial-match score', () => {
    const result = createFigmaImportProposal({
      sourceUrl,
      targetName: 'Hero',
      candidates: [
        candidate({ name: 'Other', nodeId: 'other' }),
        candidate({ name: '   ', nodeId: 'empty' }),
      ],
    })

    expect(result.candidates.map(({ nodeId }) => nodeId)).toEqual(['other', 'empty'])
    expect(result.reasons).toContain('No name or aspect-ratio match signal was supplied.')
  })

  it('ranks exact and partial normalized name matches with aspect compatibility', () => {
    const result = createFigmaImportProposal({
      sourceUrl,
      targetName: '  Homepage   Hero ',
      targetAspectRatio: 16 / 9,
      candidates: [
        candidate({ name: 'Homepage hero', width: 1200, height: 900 }),
        candidate({ name: 'Homepage Hero', width: 1600, height: 900, nodeId: '2:2' }),
        candidate({ name: 'Homepage hero mobile', width: 390, height: 844, nodeId: '3:3' }),
      ],
    })

    expect(result.candidates.map(({ nodeId }) => nodeId)).toEqual(['2:2', '1:1', '3:3'])
    expect(result.reasons.length).toBeGreaterThan(0)
    expect(result.provenance).toMatchObject({
      provider: 'figma',
      fileKey: 'file_123',
      sourceUrl: 'https://www.figma.com/design/file_123/Portfolio?node-id=12%3A34',
    })
  })

  it('uses stable input order to break equal ranking ties', () => {
    const first = candidate({ nodeId: 'first', name: 'Other', width: 100, height: 100 })
    const second = candidate({ nodeId: 'second', name: 'Other', width: 100, height: 100 })

    const result = createFigmaImportProposal({
      sourceUrl,
      candidates: [first, second],
      targetName: 'No match',
      targetAspectRatio: 1,
    })

    expect(result.candidates.map(({ nodeId }) => nodeId)).toEqual(['first', 'second'])
  })

  it.each([
    ['high', 5, 1],
    ['low', -2, 0],
    ['infinite', Number.POSITIVE_INFINITY, 1],
  ])('clamps supplied %s confidence to the proposal range', (_name, confidence, expected) => {
    expect(
      createFigmaImportProposal({ sourceUrl, candidates: [], confidence }).confidence,
    ).toBe(expected)
  })

  it('always requires human confirmation and returns immutable copies', () => {
    const placement = {
      assetId: 'asset-1',
      focalX: 0.25,
      focalY: 0.75,
      zoom: 2,
      fit: 'contain' as const,
      frame: { aspectRatio: 16 / 9 },
      breakpointOverrides: { mobile: { focalX: 0.5 } },
    }
    const inputCandidate = candidate({ placement, thumbnailUrl: 'https://cdn.test/thumb.png' })
    const original = structuredClone(inputCandidate)

    const result = createFigmaImportProposal({ sourceUrl, candidates: [inputCandidate] })

    expect(result.requiresConfirmation).toBe(true)
    expect(result.candidates).not.toBe(inputCandidate)
    expect(result.candidates[0]).not.toBe(inputCandidate)
    expect(result.candidates[0].placement).not.toBe(placement)
    expect(result.candidates[0].placement?.frame).not.toBe(placement.frame)
    expect(result.candidates[0].placement?.breakpointOverrides).not.toBe(
      placement.breakpointOverrides,
    )

    result.candidates[0].name = 'changed'
    result.candidates[0].placement!.frame!.aspectRatio = 1
    result.candidates[0].placement!.breakpointOverrides!.mobile!.focalX = 0.9
    expect(inputCandidate).toEqual(original)
  })
})
