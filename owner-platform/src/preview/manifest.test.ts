import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { createPreviewManifest, hashPreviewManifest, PREVIEW_LIMITS, type PreviewManifestInput } from './manifest'

const lexical = { root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Texto con estilo', format: 0, style: 'color: var(--accent)' }] }] } }
const input: PreviewManifestInput = {
  source: { collection: 'pages', documentId: 'home', versionId: 'current:2026-09-04T12:00:00Z' },
  brandTokens: { colors: [{ role: 'text', value: '#FFFFFF' }], motion: { duration: 600 } },
  pageBlocks: [{ blockType: 'richText', content: lexical }],
  mediaReferences: [{ id: 'media-1', alt: 'Portada', filename: 'cover.webp' }],
}

describe('preview manifests', () => {
  it('binds media recipes and responsive overrides to the hash while preserving legacy omission', () => {
    const mediaPlacements = [{ id: '14', versionId: 'current:saved', placement: {
      asset: 9, focalX: 0.2, focalY: 0.7, fit: 'cover', frame: '4:3', zoom: 2, overrides: { mobile: { zoom: 1 } },
    } }]
    const captured = createPreviewManifest({ ...input, mediaPlacements } as never)
    expect(captured).toHaveProperty('mediaPlacements', mediaPlacements)
    expect(captured.hash).not.toBe(createPreviewManifest(input).hash)
    mediaPlacements[0].placement.overrides.mobile.zoom = 3
    expect(captured).toHaveProperty('mediaPlacements.0.placement.overrides.mobile.zoom', 1)
    expect(() => hashPreviewManifest({ ...captured, mediaPlacements } as never)).toThrow(/hash/i)
    expect(createPreviewManifest(input)).not.toHaveProperty('mediaPlacements')
  })

  it.each([null, {}, [{ id: '14', versionId: 'current:saved', placement: { asset: 9, zoom: 99 } }]])('rejects malformed captured recipes %s', (mediaPlacements) => {
    expect(() => createPreviewManifest({ ...input, mediaPlacements } as never)).toThrow()
  })

  it.each(['duplicate', 'no-id', 'no-revision', 'extra-field', 'implicit-default'])('rejects ambiguous captured recipe %s', (fault) => {
    const entry: Record<string, unknown> = { id: '14', versionId: 'current:saved', placement: { asset: 9, focalX: 0.5, focalY: 0.5, fit: 'cover', frame: 'auto', zoom: 1, overrides: {} } }
    if (fault === 'no-id') delete entry.id
    if (fault === 'no-revision') delete entry.versionId
    if (fault === 'extra-field') entry.apiToken = 'secret'
    if (fault === 'implicit-default') delete (entry.placement as Record<string, unknown>).zoom
    const mediaPlacements = fault === 'duplicate' ? [entry, entry] : [entry]
    expect(() => createPreviewManifest({ ...input, mediaPlacements } as never)).toThrow()
  })

  it('rejects a stored recipe with an invalid zoom despite a valid checksum', () => {
    const serialized = '{"brandTokens":{},"mediaPlacements":[{"id":"14","placement":{"asset":9,"fit":"cover","focalX":0.5,"focalY":0.5,"frame":"auto","overrides":{},"zoom":99},"versionId":"current:saved"}],"mediaReferences":[],"pageBlocks":[],"schemaVersion":1,"source":{"collection":"pages","documentId":"7","versionId":"v"}}'
    const stored = { ...JSON.parse(serialized), hash: `sha256:${createHash('sha256').update(serialized).digest('hex')}` }
    expect(() => hashPreviewManifest(stored)).toThrow(/zoom/i)
  })

  it('binds the captured page title to the hash without changing title-less historical input', () => {
    const legacy = createPreviewManifest(input)
    const captured = createPreviewManifest({ ...input, pageTitle: 'Título guardado' } as never)
    expect(captured).toHaveProperty('pageTitle', 'Título guardado')
    expect(captured.hash).not.toBe(legacy.hash)
    expect(() => hashPreviewManifest({ ...captured, pageTitle: 'Otro título' } as never)).toThrow(/hash/i)
    expect(createPreviewManifest(input)).toEqual(legacy)
    expect(legacy).not.toHaveProperty('pageTitle')
  })

  it.each([null, 17, { token: 'must-not-export' }])('rejects non-text captured titles: %s', (pageTitle) => {
    expect(() => createPreviewManifest({ ...input, pageTitle } as never)).toThrow(/título/i)
  })

  it('rejects a non-text title in stored JSON even when its checksum is valid', () => {
    const serialized = '{"brandTokens":{},"mediaReferences":[],"pageBlocks":[],"pageTitle":17,"schemaVersion":1,"source":{"collection":"pages","documentId":"7","versionId":"v"}}'
    const stored = { ...JSON.parse(serialized), hash: `sha256:${createHash('sha256').update(serialized).digest('hex')}` }
    expect(() => hashPreviewManifest(stored)).toThrow(/título/i)
  })

  it('hashes canonical object order deterministically while preserving array order', () => {
    const first = createPreviewManifest(input)
    const second = createPreviewManifest({
      mediaReferences: [{ filename: 'cover.webp', alt: 'Portada', id: 'media-1' }],
      pageBlocks: [{ content: lexical, blockType: 'richText' }],
      brandTokens: { motion: { duration: 600 }, colors: [{ value: '#FFFFFF', role: 'text' }] },
      source: { versionId: input.source.versionId, documentId: 'home', collection: 'pages' },
    })
    expect(second).toEqual(first)
    expect(first.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hashPreviewManifest(first)).toBe(first.hash)
    expect(createPreviewManifest({ ...input, mediaReferences: [...input.mediaReferences].reverse() }).hash).toBe(first.hash)
  })

  it('accepts actual Lexical-shaped content including its legitimate style field', () => {
    expect(createPreviewManifest(input).pageBlocks[0]).toEqual({ blockType: 'richText', content: lexical })
  })

  it('returns a detached deeply frozen manifest', () => {
    const original = structuredClone(input)
    const manifest = createPreviewManifest(original)
    const mutableBlock = original.pageBlocks[0] as { content: typeof lexical }
    mutableBlock.content.root.children[0].children[0].text = 'cambiado'
    expect(JSON.stringify(manifest)).toContain('Texto con estilo')
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.pageBlocks[0])).toBe(true)
  })

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, 2n, new Date()])(
    'rejects non-JSON values %#',
    (unsafe) => expect(() => createPreviewManifest({ ...input, brandTokens: { unsafe } })).toThrow(/JSON/i),
  )

  it('rejects cycles and prototype-bearing objects', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => createPreviewManifest({ ...input, brandTokens: cyclic })).toThrow(/cíclica/i)
    expect(() => createPreviewManifest({ ...input, brandTokens: new (class Token {})() as never })).toThrow(/JSON/i)
  })

  it('enforces depth, node, array, string and serialized-byte bounds before hashing', () => {
    let deep: Record<string, unknown> = { value: 'ok' }
    for (let index = 0; index <= PREVIEW_LIMITS.maxDepth; index += 1) deep = { child: deep }
    expect(() => createPreviewManifest({ ...input, brandTokens: deep })).toThrow(/profundidad/i)
    expect(() => createPreviewManifest({ ...input, pageBlocks: new Array(PREVIEW_LIMITS.maxArrayLength + 1).fill(null) })).toThrow(/lista/i)
    expect(() => createPreviewManifest({ ...input, pageBlocks: [{ text: 'x'.repeat(PREVIEW_LIMITS.maxStringLength + 1) }] })).toThrow(/texto/i)
    expect(() => createPreviewManifest({ ...input, pageBlocks: new Array(PREVIEW_LIMITS.maxNodes + 1).fill({ x: 1 }) })).toThrow(/nodos|lista/i)
    expect(() => createPreviewManifest({ ...input, pageBlocks: new Array(11).fill(null).map(() => ({ text: 'é'.repeat(PREVIEW_LIMITS.maxStringLength) })) })).toThrow(/bytes/i)
  })

  it('rejects a forged hash', () => {
    expect(() => hashPreviewManifest({ ...createPreviewManifest(input), hash: 'sha256:forged' })).toThrow(/hash/i)
  })
})
