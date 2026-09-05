import { describe, expect, it } from 'vitest'
import { contentPreviewLayout } from './content-layout'

const text = { root: { type: 'root', version: 1, children: [] } }
describe('editorial content layout adapter', () => {
  it('keeps the legacy article body when no modular layout exists', () => {
    expect(contentPreviewLayout('articles', { title: 'Blog', excerpt: 'Resumen', coverImage: 9, content: text })).toEqual([
      { blockType: 'hero', heading: 'Blog', description: 'Resumen', image: 9 },
      { blockType: 'richText', content: text },
    ])
  })
  it('does not duplicate the legacy body when an article has modular content', () => {
    const result = contentPreviewLayout('articles', { title: 'Blog', content: text, articleLayout: [
      { blockType: 'articleQuote', quote: 'Una idea', attribution: 'Autora' },
      { blockType: 'articleCallout', heading: 'Nota', tone: 'note', content: text },
      { blockType: 'articleMedia', asset: 9, alt: 'Alt contextual', caption: 'Imagen' },
    ] })
    expect(result.map((block) => block.blockType)).toEqual(['hero', 'quote', 'callout', 'media'])
    expect(result[3]).toMatchObject({ alt: 'Alt contextual', caption: 'Imagen' })
  })
  it('preserves project galleries, metrics, quotes and feature order without flattening groups', () => {
    const layout = [
      { blockType: 'caseGallery', heading: 'Galería', items: [{ asset: 8, alt: 'Uno' }, { asset: 9, alt: 'Dos' }] },
      { blockType: 'caseMetrics', items: [{ value: '3', label: 'Roles' }] },
      { blockType: 'caseQuote', quote: 'Cita', attribution: 'Fuente' },
      { blockType: 'caseFeature', featureKey: 'technology-stack' },
    ]
    const result = contentPreviewLayout('projects', { title: 'Proyecto', summary: 'Resumen', heroImage: 4, heroPlacement: 2, body: text, caseStudyLayout: layout })
    expect(result.map((block) => block.blockType)).toEqual(['hero', 'gallery', 'metrics', 'quote', 'customFeature'])
    expect(result[0]).toMatchObject({ image: 4, placement: 2 })
    expect(result[1].items).toEqual(layout[0].items)
  })
  it('passes page layouts through without rewriting their order or content', () => {
    const layout = [{ blockType: 'hero', heading: 'Original' }]
    expect(contentPreviewLayout('pages', { layout })).toBe(layout)
  })
  it('preserves unknown block names for an explicit unsupported-block notice', () => {
    const result = contentPreviewLayout('articles', { title: 'Blog', articleLayout: [{ blockType: 'constructor' }] })
    expect(result[1].blockType).toBe('constructor')
  })
  it('rejects malformed modular layouts rather than falling back to stale content', () => {
    expect(() => contentPreviewLayout('articles', { content: text, articleLayout: 'invalid' })).toThrow(/layout/)
  })
})
