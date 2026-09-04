import { describe, expect, it } from 'vitest'

import { parseOwnerSearchQuery } from './query'

describe('parseOwnerSearchQuery', () => {
  it('normalizes a bounded search query', () => {
    expect(parseOwnerSearchQuery(new URL('https://owner.test/api?q=%20Sistema%20'))).toBe('Sistema')
  })

  it.each(['https://owner.test/api', 'https://owner.test/api?q=x', `https://owner.test/api?q=${'x'.repeat(81)}`, 'https://owner.test/api?q=a&q=b', 'https://owner.test/api?q=test&token=x'])('rejects unsafe or ambiguous queries: %s', (url) => {
    expect(() => parseOwnerSearchQuery(new URL(url))).toThrow(/búsqueda|parámetro/i)
  })
})
