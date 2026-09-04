type Counts = { drafts: number; published: number; total: number }
type Issues = { assetsMissingAlt: number; assetsMissingDimensions: number; assetsMissingMimeType: number; assetsOverFiveMegabytes: number; placementsMissingAsset: number }
type Input = { assets: Counts; issues: Issues; placements: Counts }

const count = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError('El recuento no es válido.')
  return value as number
}
const inventory = (value: Counts) => {
  const result = { drafts: count(value.drafts), published: count(value.published), total: count(value.total) }
  if (result.drafts + result.published !== result.total) throw new TypeError('El total del inventario no coincide.')
  return result
}

export const buildMediaHealth = (input: Input) => {
  const assets = inventory(input.assets)
  const placements = inventory(input.placements)
  const issues = Object.fromEntries(Object.entries(input.issues).map(([key, value]) => [key, count(value)])) as Issues
  if (issues.assetsMissingAlt > assets.total || issues.assetsMissingDimensions > assets.total || issues.assetsMissingMimeType > assets.total || issues.assetsOverFiveMegabytes > assets.total || issues.placementsMissingAsset > placements.total) throw new TypeError('El recuento de incidencias supera el inventario.')
  return { assets, issueCount: Object.values(issues).reduce((sum, value) => sum + value, 0), issues, placements }
}
