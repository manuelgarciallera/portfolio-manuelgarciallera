import { describe, expect, it } from 'vitest'
import { ARTICLES, ARTICLE_AUTHOR } from './articles'

describe('editorial content', () => {
  it('publishes four complete and uniquely addressable articles', () => {
    expect(ARTICLES).toHaveLength(4)
    expect(new Set(ARTICLES.map(({ slug }) => slug)).size).toBe(4)
    expect(ARTICLES.every(({ sections }) => sections.length >= 3)).toBe(true)
  })

  it('attributes every article to Manuel', () => {
    expect(ARTICLE_AUTHOR.name).toBe('Manuel García-Llera')
    expect(ARTICLE_AUTHOR.bio).toContain('HCI')
  })
})
