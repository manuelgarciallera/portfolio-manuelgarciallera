type RecentInput = { articles: unknown[]; pages: unknown[]; projects: unknown[] }
const statuses = new Set(['draft', 'published'])

const item = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('El contenido reciente no es válido.')
  const source = value as Record<string, unknown>
  if ((typeof source.id !== 'string' && typeof source.id !== 'number') || !String(source.id).trim()) throw new TypeError('El identificador no es válido.')
  if (typeof source.title !== 'string' || !source.title.trim()) throw new TypeError('El título no es válido.')
  if (typeof source.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.slug)) throw new TypeError('El slug no es válido.')
  if (typeof source._status !== 'string' || !statuses.has(source._status)) throw new TypeError('El estado no es válido.')
  if (typeof source.updatedAt !== 'string' || Number.isNaN(Date.parse(source.updatedAt))) throw new TypeError('La fecha no es válida.')
  return { id: source.id, title: source.title.trim(), slug: source.slug, status: source._status as 'draft' | 'published', updatedAt: new Date(source.updatedAt).toISOString() }
}
const list = (value: unknown[]) => {
  if (!Array.isArray(value) || value.length > 5) throw new TypeError('La lista reciente no es válida.')
  return value.map(item)
}

export const buildRecentContent = (input: RecentInput) => ({ articles: list(input.articles), pages: list(input.pages), projects: list(input.projects) })
