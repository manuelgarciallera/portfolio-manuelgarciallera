type CollectionCounts = Readonly<{ drafts: number; published: number; total: number }>
type IssueCounts = Readonly<{
  articlesMissingSeo: number
  pagesMissingBrand: number
  pagesMissingSeo: number
  projectsMissingSeo: number
  projectsWithoutCatalogStack: number
}>
type ContentHealthInput = Readonly<{ articles: CollectionCounts; issues: IssueCounts; pages: CollectionCounts; projects: CollectionCounts }>

const count = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError('El recuento no es válido.')
  return value as number
}
const collection = (value: CollectionCounts): CollectionCounts => {
  const normalized = { drafts: count(value.drafts), published: count(value.published), total: count(value.total) }
  if (normalized.drafts + normalized.published !== normalized.total) throw new TypeError('El total editorial no coincide.')
  return normalized
}

export const buildContentHealth = (input: ContentHealthInput) => {
  const collections = { articles: collection(input.articles), pages: collection(input.pages), projects: collection(input.projects) }
  const issues = {
    articlesMissingSeo: count(input.issues.articlesMissingSeo),
    pagesMissingBrand: count(input.issues.pagesMissingBrand),
    pagesMissingSeo: count(input.issues.pagesMissingSeo),
    projectsMissingSeo: count(input.issues.projectsMissingSeo),
    projectsWithoutCatalogStack: count(input.issues.projectsWithoutCatalogStack),
  }
  if (issues.articlesMissingSeo > collections.articles.total || issues.pagesMissingBrand > collections.pages.total || issues.pagesMissingSeo > collections.pages.total || issues.projectsMissingSeo > collections.projects.total || issues.projectsWithoutCatalogStack > collections.projects.total) throw new TypeError('El recuento de incidencias supera el total editorial.')
  return Object.freeze({ collections, issueCount: Object.values(issues).reduce((sum, value) => sum + value, 0), issues })
}
