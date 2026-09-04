import { APIError } from 'payload'

import { isOwner } from '../access/owner'

type Loader = (user: unknown) => Promise<unknown>

export const getOwnerDashboardOverview = async ({
  activity,
  analytics,
  content,
  integrations,
  media,
  recent,
  releases,
  user,
  workflow,
}: {
  activity: Loader
  analytics: Loader
  content: Loader
  integrations: Loader
  media: Loader
  recent: Loader
  releases: Loader
  user: unknown
  workflow: Loader
}) => {
  if (!isOwner(user)) throw new APIError('Se requiere una sesión owner.', 403)
  const analyticsResult = analytics(user).then(
    (data) => ({ available: true as const, data }),
    (error: unknown) => {
      if (error instanceof APIError && error.status === 404) return { available: false as const, data: null }
      throw error
    },
  )
  const [contentData, releaseData, analyticsData, activityData, workflowData, integrationData, mediaData, recentData] = await Promise.all([
    content(user),
    releases(user),
    analyticsResult,
    activity(user),
    workflow(user),
    integrations(user),
    media(user),
    recent(user),
  ])
  return { activity: activityData, analytics: analyticsData, content: contentData, integrations: integrationData, media: mediaData, recent: recentData, releases: releaseData, workflow: workflowData }
}
