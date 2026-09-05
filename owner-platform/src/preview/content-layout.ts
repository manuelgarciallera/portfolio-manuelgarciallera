export const previewCollections = ['pages', 'articles', 'projects'] as const
export type PreviewCollection = typeof previewCollections[number]
export const isPreviewCollection = (value: unknown): value is PreviewCollection => previewCollections.some((collection) => collection === value)

const blockTypes: Record<string, string> = {
  articleText: 'richText', caseSection: 'richText',
  articleMedia: 'media', caseMedia: 'media',
  articleGallery: 'gallery', caseGallery: 'gallery',
  articleQuote: 'quote', caseQuote: 'quote',
  articleCallout: 'callout', relatedProjects: 'projectGrid',
  caseMetrics: 'metrics', caseFeature: 'customFeature',
}

/** Project native editorial blocks without mutating, flattening or duplicating legacy content. */
export const contentPreviewLayout = (collection: PreviewCollection, source: Record<string, unknown>): Record<string, unknown>[] => {
  const value = source[collection === 'pages' ? 'layout' : collection === 'articles' ? 'articleLayout' : 'caseStudyLayout']
  if (value != null && !Array.isArray(value)) throw new Error('El layout debe ser una lista de bloques.')
  const layout = value ?? []
  if (layout.length > 100 || layout.some((block) => !block || typeof block !== 'object' || Array.isArray(block))) throw new Error('El layout debe contener como máximo 100 bloques válidos.')
  if (collection === 'pages') return layout
  const article = collection === 'articles'
  const hero: Record<string, unknown> = { blockType: 'hero', heading: source.title, description: article ? source.excerpt : source.summary, image: article ? source.coverImage : source.heroImage }
  if (!article) hero.placement = source.heroPlacement
  const body = article ? source.content : source.body
  return [hero, ...(layout.length ? layout.map((block) => ({ ...block, blockType: Object.hasOwn(blockTypes, block.blockType) ? blockTypes[block.blockType] : block.blockType })) : body == null ? [] : [{ blockType: 'richText', content: body }])]
}
