import { describe, expect, it } from 'vitest'

import { createPreviewManifest, hashPreviewManifest } from './manifest'

const input = {
  source: { collection: 'pages', documentId: 'home', versionId: 7 },
  brandTokens: { text: '#FFFFFF', background: '#000000', accent: '#FF4B44' },
  pageBlocks: [{ type: 'hero', title: 'Portfolio' }],
  mediaReferences: ['media-2', 'media-1'],
  motion: { duration: 600, easing: 'ease-out', reducedMotion: 'reduce' },
}

describe('preview manifests', () => {
  it('produces the same canonical manifest and SHA-256 hash regardless of object key order', () => {
    const first = createPreviewManifest(input)
    const second = createPreviewManifest({
      motion: { reducedMotion: 'reduce', easing: 'ease-out', duration: 600 },
      mediaReferences: ['media-2', 'media-1'],
      pageBlocks: [{ title: 'Portfolio', type: 'hero' }],
      brandTokens: { accent: '#FF4B44', background: '#000000', text: '#FFFFFF' },
      source: { versionId: 7, documentId: 'home', collection: 'pages' },
    })

    expect(second).toEqual(first)
    expect(first.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hashPreviewManifest(first)).toBe(first.hash)
  })

  it('keeps array order significant and returns a detached immutable value', () => {
    const original = structuredClone(input)
    const first = createPreviewManifest(original)
    const reordered = createPreviewManifest({ ...input, mediaReferences: ['media-1', 'media-2'] })

    original.brandTokens.accent = '#000000'
    expect(first.brandTokens.accent).toBe('#FF4B44')
    expect(reordered.hash).not.toBe(first.hash)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.pageBlocks)).toBe(true)
  })

  it.each([
    ['secret', 'value'],
    ['api_key', 'value'],
    ['authorization', 'Bearer value'],
    ['accessToken', 'value'],
    ['cookie', 'value'],
    ['password', 'value'],
  ])('rejects secret-bearing key %s at any depth', (key, value) => {
    expect(() =>
      createPreviewManifest({ ...input, pageBlocks: [{ type: 'hero', nested: { [key]: value } }] }),
    ).toThrow(/secret|credential/i)
  })

  it.each(['__proto__', 'prototype', 'constructor'])('rejects prototype key %s', (key) => {
    const unsafe = JSON.parse(`{"${key}": {"polluted": true}}`)
    expect(() => createPreviewManifest({ ...input, brandTokens: unsafe })).toThrow(/prototipo/i)
  })

  it.each([
    [{ customCSS: 'body { display: none }' }],
    [{ html: '<p>raw</p>' }],
    [{ javascript: 'alert(1)' }],
    [{ onClick: 'run()' }],
    [{ href: 'javascript:alert(1)' }],
    [{ text: '<script>alert(1)</script>' }],
    [{ style: 'background: red' }],
  ])('rejects executable configuration or active content %#', (unsafe) => {
    expect(() => createPreviewManifest({ ...input, pageBlocks: [unsafe] })).toThrow(/ejecutable/i)
  })

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, 2n, new Date()])(
    'rejects non-JSON manifest values %#',
    (unsafe) => {
      expect(() => createPreviewManifest({ ...input, brandTokens: { unsafe } })).toThrow(/JSON/i)
    },
  )

  it('rejects cyclic input instead of recursing indefinitely', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => createPreviewManifest({ ...input, brandTokens: cyclic })).toThrow(/cíclica/i)
  })

  it('rejects an externally supplied or malformed hash', () => {
    expect(() => createPreviewManifest({ ...input, hash: 'sha256:forged' } as never)).toThrow(/hash/i)
    expect(() => hashPreviewManifest({ ...createPreviewManifest(input), hash: 'sha256:forged' })).toThrow(
      /hash/i,
    )
  })
})
