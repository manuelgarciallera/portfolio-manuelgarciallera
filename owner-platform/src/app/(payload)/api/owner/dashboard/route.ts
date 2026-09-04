import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { getOwnerAnalyticsSummary } from '@/analytics/summary-service'
import { getOwnerAuditActivity } from '@/audit/activity-service'
import { assertCurrentProductionRuntime } from '@/config/runtime'
import { getOwnerContentHealth } from '@/dashboard/content-health-service'
import { getOwnerIntegrationStatus } from '@/dashboard/integration-status-service'
import { getOwnerMediaHealth } from '@/dashboard/media-health-service'
import { getOwnerRecentContent } from '@/dashboard/recent-content-service'
import { handleDashboardOverviewRequest } from '@/dashboard/overview-request'
import { getOwnerDashboardOverview } from '@/dashboard/overview-service'
import { getOwnerWorkflowSummary } from '@/dashboard/workflow-summary-service'
import { getOwnerReleaseSummary } from '@/releases/summary-service'

export const GET = async (request: Request): Promise<Response> => {
  assertCurrentProductionRuntime()
  const payload = await getPayload({ config })
  return handleDashboardOverviewRequest(request, {
    authenticate: (headers) => payload.auth({ headers }),
    load: async (user) => {
      const req = await createLocalReq({ req: { headers: request.headers }, user: user as never }, payload)
      return getOwnerDashboardOverview({
        activity: () => getOwnerAuditActivity({ payload: payload as never, req }),
        analytics: () => getOwnerAnalyticsSummary({ payload: payload as never, req }),
        content: () => getOwnerContentHealth({ payload: payload as never, req }),
        integrations: () => getOwnerIntegrationStatus({ environment: { figmaPlan: process.env.FIGMA_PLAN, figmaToken: process.env.FIGMA_PERSONAL_ACCESS_TOKEN }, payload: payload as never, req }),
        media: () => getOwnerMediaHealth({ payload: payload as never, req }),
        recent: () => getOwnerRecentContent({ payload: payload as never, req }),
        releases: () => getOwnerReleaseSummary({ payload: payload as never, req }),
        user,
        workflow: () => getOwnerWorkflowSummary({ payload: payload as never, req }),
      })
    },
  })
}
