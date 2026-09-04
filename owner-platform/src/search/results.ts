const collections = ['articles', 'media', 'pages', 'projects'] as const
type Collection = (typeof collections)[number]
type Input = Record<Collection, unknown[]>

const record = (value: unknown): Record<string, unknown> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined
const status = (value: unknown): 'draft' | 'published' | undefined => value === 'draft' || value === 'published' ? value : undefined

export const buildOwnerSearchResults = (input: Input) => {
  const results = collections.flatMap((collection) => input[collection].slice(0, 10).flatMap((value) => {
    const item = record(value)
    if (!item || (typeof item.id !== 'string' && typeof item.id !== 'number')) return []
    const id = item.id
    const label = collection === 'media' ? text(item.alt) ?? text(item.filename) : text(item.title)
    const updatedAt = text(item.updatedAt)
    if (!label || !updatedAt || Number.isNaN(Date.parse(updatedAt))) return []
    const slug = collection === 'media' ? undefined : text(item.slug)
    return [{
      adminPath: `/admin/collections/${collection}/${encodeURIComponent(String(id))}`,
      collection,
      id,
      label,
      ...(slug ? { slug } : {}),
      ...(status(item._status) ? { status: status(item._status) } : {}),
      updatedAt,
    }]
  }))
  return { count: results.length, results }
}
