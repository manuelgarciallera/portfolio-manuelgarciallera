import { describe, expect, it } from 'vitest'

import { buildContentHealth } from './content-health'

describe('content health', () => {
  it('builds a stable dashboard summary with actionable issue totals', () => {
    expect(buildContentHealth({
      articles: { drafts: 2, published: 4, total: 6 },
      issues: { articlesMissingSeo: 3, pagesMissingBrand: 1, pagesMissingSeo: 2, projectsMissingSeo: 1, projectsWithoutCatalogStack: 2 },
      pages: { drafts: 1, published: 3, total: 4 },
      projects: { drafts: 2, published: 2, total: 4 },
    })).toEqual({
      collections: {
        articles: { drafts: 2, published: 4, total: 6 },
        pages: { drafts: 1, published: 3, total: 4 },
        projects: { drafts: 2, published: 2, total: 4 },
      },
      issueCount: 9,
      issues: { articlesMissingSeo: 3, pagesMissingBrand: 1, pagesMissingSeo: 2, projectsMissingSeo: 1, projectsWithoutCatalogStack: 2 },
    })
  })

  it('rejects negative, fractional and inconsistent counters', () => {
    const valid = { articles: { drafts: 0, published: 1, total: 1 }, issues: { articlesMissingSeo: 0, pagesMissingBrand: 0, pagesMissingSeo: 0, projectsMissingSeo: 0, projectsWithoutCatalogStack: 0 }, pages: { drafts: 0, published: 1, total: 1 }, projects: { drafts: 0, published: 1, total: 1 } }
    expect(() => buildContentHealth({ ...valid, projects: { drafts: -1, published: 1, total: 0 } })).toThrow(/recuento/i)
    expect(() => buildContentHealth({ ...valid, projects: { drafts: 0.5, published: 1, total: 1.5 } })).toThrow(/recuento/i)
    expect(() => buildContentHealth({ ...valid, projects: { drafts: 1, published: 1, total: 1 } })).toThrow(/total/i)
  })
})
