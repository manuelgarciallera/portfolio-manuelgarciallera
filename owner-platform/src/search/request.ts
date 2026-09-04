import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { parseOwnerSearchQuery } from './query'

type Dependencies = {
  authenticate: (headers: Headers) => Promise<{ user: unknown }>
  search: (query: string, user: unknown) => Promise<unknown>
}

export const handleOwnerSearchRequest = async (request: Request, dependencies: Dependencies): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const query = parseOwnerSearchQuery(new URL(request.url))
    return Response.json({ search: await dependencies.search(query, authentication.user) })
  } catch (error) {
    if (error instanceof TypeError) return Response.json({ error: 'Invalid search query.' }, { status: 400 })
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: 'Owner search failed.' }, { status })
    }
    return Response.json({ error: 'Owner search failed.' }, { status: 500 })
  }
}
