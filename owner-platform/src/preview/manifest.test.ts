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
