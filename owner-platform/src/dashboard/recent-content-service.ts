import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildRecentContent } from './recent-content'

type FindPayload = { find(args: Record<string, unknown>): Promise<{ docs: unknown[] }> }
const select = { _status: true, slug: true, title: true, updatedAt: true }

export const getOwnerRecentContent = async ({ payload, req }: { payload: FindPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const load = async (collection: 'articles' | 'pages' | 'projects') => (await payload.find({ collection, depth: 0, limit: 5, overrideAccess: false, req, select, sort: '-updatedAt' })).docs
  const [articles, pages, projects] = await Promise.all([load('articles'), load('pages'), load('projects')])
  return buildRecentContent({ articles, pages, projects })
}
