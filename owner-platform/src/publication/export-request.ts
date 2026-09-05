import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import type { PublicationExport } from './export'

const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]{1,128}$/.test(String(value))

export const handlePublicationExportRequest = async (request: Request, artifactId: string | number, dependencies: {
  authenticate(headers: Headers): Promise<{ user: unknown }>
  generate(artifactId: string | number, user: unknown): Promise<PublicationExport>
}): Promise<Response> => {
  try {
    const authentication = await dependencies.authenticate(request.headers)
    if (!isOwner(authentication.user)) return Response.json({ error: 'Owner authentication required.' }, { status: 403 })
    if (!safeId(artifactId)) return Response.json({ error: 'Invalid publication artifact identifier.' }, { status: 400 })
    const output = await dependencies.generate(artifactId, authentication.user)
    const body = JSON.stringify(output)
    return new Response(body, { status: 200, headers: {
      'cache-control': 'private, no-store',
      'content-disposition': `attachment; filename="portfolio-export-${String(artifactId)}.json"`,
      'content-type': 'application/json; charset=utf-8',
      'x-content-sha256': output.hash,
      'x-content-type-options': 'nosniff',
    } })
  } catch (error) {
    if (error instanceof APIError) return Response.json({ error: 'Publication export failed.' }, { status: error.status >= 400 && error.status < 500 ? error.status : 500 })
    return Response.json({ error: 'Publication export failed.' }, { status: 500 })
  }
}
