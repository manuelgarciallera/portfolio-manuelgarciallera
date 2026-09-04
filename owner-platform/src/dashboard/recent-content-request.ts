import { APIError } from 'payload'
import { isOwner } from '../access/owner'

export const handleRecentContentRequest = async (request: Request, dependencies: { authenticate: (headers: Headers) => Promise<{ user: unknown }>; load: (user: unknown) => Promise<unknown> }): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    return Response.json({ recent: await dependencies.load(authentication.user) })
  } catch (error) {
    if (error instanceof APIError) { const status = error.status >= 400 && error.status < 500 ? error.status : 500; return Response.json({ error: 'Recent content failed.' }, { status }) }
    return Response.json({ error: 'Recent content failed.' }, { status: 500 })
  }
}
