import { APIError } from 'payload'

import { isOwner } from '../access/owner'

export const handleAssistanceContextRequest = async (
  request: Request,
  dependencies: {
    authenticate: (headers: Headers) => Promise<{ user: unknown }>
    load: (sourceSnapshot: string | number, user: unknown) => Promise<unknown>
  },
): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    const raw = new URL(request.url).searchParams.get('sourceSnapshot')
    if (!raw || !/^[A-Za-z0-9_-]{1,64}$/.test(raw)) return Response.json({ error: 'Invalid assistance context request.' }, { status: 400 })
    const sourceSnapshot = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : raw
    return Response.json({ contextPackage: await dependencies.load(sourceSnapshot, authentication.user) })
  } catch (error) {
    if (error instanceof APIError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 500
      return Response.json({ error: 'Assistance context export failed.' }, { status })
    }
    return Response.json({ error: 'Assistance context export failed.' }, { status: 500 })
  }
}
