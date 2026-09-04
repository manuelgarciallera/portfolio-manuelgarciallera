import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildOwnerSearchResults } from './results'

type FindPayload = { find(args: Record<string, unknown>): Promise<{ docs: unknown[] }> }
type SearchCollection = 'articles' | 'media' | 'pages' | 'projects'
const editorialSelect = { _status: true, slug: true, title: true, updatedAt: true }
const mediaSelect = { _status: true, alt: true, filename: true, updatedAt: true }

export const searchOwnerContent = async ({ payload, query, req }: { payload: FindPayload; query: string; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const load = async (collection: SearchCollection) => {
    const fields = collection === 'media' ? ['alt', 'filename'] : ['title', 'slug']
    return (await payload.find({
      collection,
      depth: 0,
      limit: 10,
      overrideAccess: false,
      req,
      select: collection === 'media' ? mediaSelect : editorialSelect,
      sort: '-updatedAt',
      where: { or: fields.map((field) => ({ [field]: { contains: query } })) },
    })).docs
  }
  const [articles, media, pages, projects] = await Promise.all([
    load('articles'), load('media'), load('pages'), load('projects'),
  ])
  return buildOwnerSearchResults({ articles, media, pages, projects })
}
