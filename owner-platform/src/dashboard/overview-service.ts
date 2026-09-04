import { APIError } from 'payload'

import { isOwner } from '../access/owner'

type Loader = (user: unknown) => Promise<unknown>

export const getOwnerDashboardOverview = async ({
  analytics,
  content,
  releases,
  user,
}: {
  analytics: Loader
  content: Loader
  releases: Loader
  user: unknown
}) => {
  if (!isOwner(user)) throw new APIError('Se requiere una sesión owner.', 403)
  const analyticsResult = analytics(user).then(
    (data) => ({ available: true as const, data }),
    (error: unknown) => {
      if (error instanceof APIError && error.status === 404) return { available: false as const, data: null }
      throw error
    },
  )
  const [contentData, releaseData, analyticsData] = await Promise.all([
    content(user),
    releases(user),
    analyticsResult,
  ])
  return { analytics: analyticsData, content: contentData, releases: releaseData }
}
