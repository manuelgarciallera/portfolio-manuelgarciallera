import { describe, expect, it } from 'vitest'

import { buildOwnerSearchResults } from './results'

describe('buildOwnerSearchResults', () => {
  it('projects lightweight editable results and admin destinations', () => {
    const result = buildOwnerSearchResults({
      articles: [{ id: 1, title: 'Sistemas', slug: 'sistemas', _status: 'published', updatedAt: '2026-09-05T10:00:00.000Z', content: 'hidden' }],
      media: [{ id: 2, alt: 'Sistema móvil', filename: 'mobile.webp', _status: 'draft', updatedAt: '2026-09-05T09:00:00.000Z', sizes: { hidden: true } }],
      pages: [],
      projects: [],
    })
    expect(result).toEqual({ count: 2, results: [
      { adminPath: '/admin/collections/articles/1', collection: 'articles', id: 1, label: 'Sistemas', slug: 'sistemas', status: 'published', updatedAt: '2026-09-05T10:00:00.000Z' },
      { adminPath: '/admin/collections/media/2', collection: 'media', id: 2, label: 'Sistema móvil', status: 'draft', updatedAt: '2026-09-05T09:00:00.000Z' },
    ] })
    expect(JSON.stringify(result)).not.toMatch(/hidden|content|sizes/)
  })
})
