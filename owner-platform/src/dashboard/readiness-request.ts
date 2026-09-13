import { APIError } from 'payload'
import { isOwner } from '../access/owner'

export const handleReadinessRequest = async (request: Request, dependencies: { authenticate: (headers: Headers) => Promise<{ user: unknown }>; load: (user: unknown) => Promise<unknown> }): Promise<Response> => {
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return respond({ error: 'Owner authentication required.' }, 403)
    return respond({ readiness: await dependencies.load(authentication.user) })
  } catch (error) {
    if (error instanceof APIError) { const status = error.status >= 400 && error.status < 500 ? error.status : 500; return respond({ error: 'Readiness check failed.' }, status) }
    return respond({ error: 'Readiness check failed.' }, 500)
  }
}
