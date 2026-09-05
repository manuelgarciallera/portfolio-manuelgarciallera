import { describe, expect, it } from 'vitest'

import configPromise from './payload.config'

describe('owner Payload configuration', () => {
  it('registers the immutable release registry in the owner application', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('releases')
  })

  it('registers reusable media placement recipes in the owner application', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('media-placements')
  })

  it('registers owner-controlled assistant capability switches', async () => {
    const config = await configPromise
    expect(config.globals.map((global) => global.slug)).toContain('assistant-settings')
  })

  it('registers the immutable owner audit ledger', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('audit-events')
  })

  it('registers the owner-reviewed assistance proposal queue', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('assistance-proposals')
  })

  it('registers non-destructive restore plans in the owner application', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('restore-plans')
  })

  it('registers immutable restorable draft snapshots', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('draft-snapshots')
  })

  it('registers immutable publication bundles without a public bridge', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('publication-bundles')
  })

  it('registers immutable publication reviews without a public bridge', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('publication-reviews')
  })

  it('registers immutable publication artifacts without a public bridge', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('publication-artifacts')
  })

  it('registers the reusable technology catalog', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('technologies')
  })

  it('registers immutable analytics snapshots without public tracking', async () => {
    const config = await configPromise
    expect(config.collections.map((collection) => collection.slug)).toContain('analytics-snapshots')
  })

  it('registers the bounded owner search on the generated dashboard', async () => {
    const config = await configPromise
    expect(config.admin.components.beforeDashboard).toEqual([
      './components/OwnerSearch#OwnerSearch',
      './components/OwnerOverview#OwnerOverview',
      './components/FigmaExplorer#FigmaExplorer',
    ])
  })

  it('groups the native owner navigation by editorial responsibility', async () => {
    const config = await configPromise
    const expected = {
      projects: 'Contenido',
      articles: 'Contenido',
      pages: 'Contenido',
      technologies: 'Contenido',
      media: 'Diseño y medios',
      'media-placements': 'Diseño y medios',
      'brand-profiles': 'Diseño y medios',
      'preview-snapshots': 'Workflow',
      releases: 'Workflow',
      'assistance-proposals': 'Workflow',
      'restore-plans': 'Workflow',
      'draft-snapshots': 'Workflow',
      'publication-bundles': 'Workflow',
      'publication-reviews': 'Workflow',
      'publication-artifacts': 'Workflow',
      users: 'Sistema',
      'audit-events': 'Sistema',
      'analytics-snapshots': 'Sistema',
    }
    const ownerCollections = config.collections.filter((collection) => collection.slug in expected)
    expect(Object.fromEntries(ownerCollections.map((collection) => [collection.slug, collection.admin?.group]))).toEqual(expected)
    expect(ownerCollections.map((collection) => collection.admin?.group).filter((group, index, groups) => index === 0 || group !== groups[index - 1])).toEqual([
      'Contenido', 'Diseño y medios', 'Workflow', 'Sistema',
    ])
    expect(config.globals.find((global) => global.slug === 'assistant-settings')?.admin?.group).toBe('Sistema')
  })
})
