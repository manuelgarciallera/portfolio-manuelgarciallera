import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { buildContentHealth } from './content-health'

type CountPayload = { count(args: Record<string, unknown>): Promise<{ totalDocs: number }> }
const status = (value: 'draft' | 'published') => ({ _status: { equals: value } })
const missing = (field: string) => ({ [field]: { exists: false } })

export const getOwnerContentHealth = async ({ payload, req }: { payload: CountPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const run = async (collection: 'articles' | 'pages' | 'projects', where?: Record<string, unknown>) => (await payload.count({ collection, overrideAccess: false, req, ...(where ? { where } : {}) })).totalDocs
  const [articleTotal, articleDrafts, articlePublished, pageTotal, pageDrafts, pagePublished, projectTotal, projectDrafts, projectPublished, articlesMissingSeo, pagesMissingBrand, pagesMissingSeo, projectsMissingSeo, projectsWithoutCatalogStack] = await Promise.all([
    run('articles'), run('articles', status('draft')), run('articles', status('published')),
    run('pages'), run('pages', status('draft')), run('pages', status('published')),
    run('projects'), run('projects', status('draft')), run('projects', status('published')),
    run('articles', missing('seo.description')), run('pages', missing('brandProfile')), run('pages', missing('seo.description')),
    run('projects', missing('seo.description')), run('projects', missing('technologyStack')),
  ])
  return buildContentHealth({
    articles: { drafts: articleDrafts, published: articlePublished, total: articleTotal },
    issues: { articlesMissingSeo, pagesMissingBrand, pagesMissingSeo, projectsMissingSeo, projectsWithoutCatalogStack },
    pages: { drafts: pageDrafts, published: pagePublished, total: pageTotal },
    projects: { drafts: projectDrafts, published: projectPublished, total: projectTotal },
  })
}
