import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { getOwnerAnalyticsSummary } from '@/analytics/summary-service'
import { getOwnerAuditActivity } from '@/audit/activity-service'
import { assertCurrentProductionRuntime } from '@/config/runtime'
import { getOwnerContentHealth } from '@/dashboard/content-health-service'
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
        releases: () => getOwnerReleaseSummary({ payload: payload as never, req }),
        user,
        workflow: () => getOwnerWorkflowSummary({ payload: payload as never, req }),
      })
    },
  })
}
