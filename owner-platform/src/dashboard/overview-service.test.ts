import { APIError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { getOwnerDashboardOverview } from './overview-service'

const owner = { id: 1, collection: 'users', role: 'owner' }

describe('getOwnerDashboardOverview', () => {
  it('loads the three owner dashboard domains in parallel', async () => {
    const content = vi.fn(async () => ({ issueCount: 2 }))
    const releases = vi.fn(async () => ({ count: 3, versions: [] }))
    const analytics = vi.fn(async () => ({ traffic: { visitors: 10 } }))
    const activity = vi.fn(async () => ({ count: 1, events: [] }))
    const workflow = vi.fn(async () => ({ attentionCount: 2 }))
    const overview = await getOwnerDashboardOverview({ activity, analytics, content, releases, user: owner, workflow })
    expect(overview).toEqual({ activity: { count: 1, events: [] }, analytics: { available: true, data: { traffic: { visitors: 10 } } }, content: { issueCount: 2 }, releases: { count: 3, versions: [] }, workflow: { attentionCount: 2 } })
    expect(content).toHaveBeenCalledWith(owner)
    expect(releases).toHaveBeenCalledWith(owner)
    expect(analytics).toHaveBeenCalledWith(owner)
    expect(activity).toHaveBeenCalledWith(owner)
    expect(workflow).toHaveBeenCalledWith(owner)
  })

  it('represents absent analytics without hiding integrity failures', async () => {
    const base = { activity: async () => ({}), content: async () => ({}), releases: async () => ({}), workflow: async () => ({}) }
    await expect(getOwnerDashboardOverview({ ...base, analytics: async () => { throw new APIError('No hay analítica disponible.', 404) }, user: owner })).resolves.toMatchObject({ analytics: { available: false, data: null } })
    await expect(getOwnerDashboardOverview({ ...base, analytics: async () => { throw new APIError('Hash inválido.', 409) }, user: owner })).rejects.toThrow(/hash/i)
  })

  it('rejects anonymous access before loading dashboard data', async () => {
    const content = vi.fn()
    await expect(getOwnerDashboardOverview({ activity: vi.fn(), analytics: vi.fn(), content, releases: vi.fn(), user: null, workflow: vi.fn() })).rejects.toThrow(/owner/i)
    expect(content).not.toHaveBeenCalled()
  })
})
