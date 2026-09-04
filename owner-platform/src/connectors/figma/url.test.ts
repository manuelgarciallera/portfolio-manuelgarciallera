import { describe, expect, it } from 'vitest'

import { parseFigmaSource } from './url'

describe('parseFigmaSource', () => {
  it.each([
    ['https://www.figma.com/design/AbC_123-xy/Portfolio?node-id=12-34', 'AbC_123-xy', '12:34'],
    ['https://figma.com/file/AbC_123-xy/Portfolio?node-id=12%3A34', 'AbC_123-xy', '12:34'],
  ])('accepts a supported Figma URL', (input, fileKey, nodeId) => {
    expect(parseFigmaSource(input)).toMatchObject({ fileKey, nodeId })
  })

  it.each([
    'http://figma.com/design/AbC_123-xy/name',
    'https://evil.figma.com/design/AbC_123-xy/name',
    'https://figma.com:444/design/AbC_123-xy/name',
    'https://user@figma.com/design/AbC_123-xy/name',
    'https://figma.com/proto/AbC_123-xy/name',
    'https://figma.com/design/a/name',
    'https://figma.com/design/AbC%2F123/name',
    'https://figma.com/design/../../name',
    'https://figma.com/design/AbC_123-xy/name?node-id=not-a-node',
    'https://figma.com/design/AbC_123-xy/name?node-id=1-2-3',
  ])('rejects an unsafe or unsupported source: %s', (input) => {
    expect(() => parseFigmaSource(input)).toThrow('Invalid Figma source')
  })
})
