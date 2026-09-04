import { describe, expect, it } from 'vitest'

import { buildRecentContent } from './recent-content'

const item = (id: number, title: string, status: 'draft' | 'published' = 'draft') => ({ id, title, slug: `item-${id}`, _status: status, updatedAt: '2026-09-05T10:00:00.000Z', body: { should: 'not leak' } })

describe('buildRecentContent', () => {
  it('returns only navigation-safe editorial metadata', () => {
    const result = buildRecentContent({ articles: [item(1, 'Artículo')], pages: [item(2, 'Página', 'published')], projects: [item(3, 'Proyecto')] })
    expect(result).toEqual({
      articles: [{ id: 1, title: 'Artículo', slug: 'item-1', status: 'draft', updatedAt: '2026-09-05T10:00:00.000Z' }],
      pages: [{ id: 2, title: 'Página', slug: 'item-2', status: 'published', updatedAt: '2026-09-05T10:00:00.000Z' }],
      projects: [{ id: 3, title: 'Proyecto', slug: 'item-3', status: 'draft', updatedAt: '2026-09-05T10:00:00.000Z' }],
    })
    expect(JSON.stringify(result)).not.toContain('should')
  })

  it('rejects malformed status and navigation metadata', () => {
    expect(() => buildRecentContent({ articles: [item(1, '')], pages: [], projects: [] })).toThrow(/título/i)
    expect(() => buildRecentContent({ articles: [{ ...item(1, 'X'), _status: 'deleted' }], pages: [], projects: [] })).toThrow(/estado/i)
  })
})
