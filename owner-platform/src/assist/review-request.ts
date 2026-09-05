import { APIError } from 'payload'
import { isOwner } from '../access/owner'

export const handleAssistanceReviewRequest = async (request: Request, id: string, dependencies: {
  authenticate(headers: Headers): Promise<{ user: unknown }>
  load(id: string, user: unknown): Promise<unknown>
}): Promise<Response> => {
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
  try {
    const { user } = await dependencies.authenticate(request.headers)
    if (!isOwner(user)) return respond({ error: 'Owner authentication required.' }, 403)
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return respond({ error: 'Invalid proposal identifier.' }, 400)
    return respond({ review: await dependencies.load(id, user) })
  } catch (error) {
    const status = error instanceof APIError && error.status >= 400 && error.status < 500 ? error.status : 500
    return respond({ error: 'Assistance comparison unavailable.' }, status)
  }
}
