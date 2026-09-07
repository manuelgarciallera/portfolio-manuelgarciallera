import { describe, expect, it } from 'vitest'

import { createFigmaImportPlan } from '../connectors/figma/import-plan'
import { enforceFigmaImportPlanDelete, FigmaImportPlans, prepareFigmaImportPlan } from './FigmaImportPlans'

const owner = { id: 1, collection: 'users', role: 'owner' }
const plan = createFigmaImportPlan({
  candidate: { id: '1:2', name: 'Hero', type: 'FRAME', width: 1440, height: 900, sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=1-2' },
  file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' },
  observedAt: '2026-09-05T05:00:00.000Z',
  source: { fileKey: 'AbCdEf', sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio' },
})

describe('FigmaImportPlans collection', () => {
  it('is immutable, owner-readable, and closed to direct client mutation', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(FigmaImportPlans.slug).toBe('figma-import-plans')
    expect(FigmaImportPlans.access?.read?.(access(owner))).toBe(true)
    expect(FigmaImportPlans.access?.read?.(access(null))).toBe(false)
    expect(FigmaImportPlans.access?.create?.(access(owner))).toBe(false)
    expect(FigmaImportPlans.access?.update?.(access(owner))).toBe(false)
    expect(FigmaImportPlans.access?.delete?.(access(owner))).toBe(false)
    expect(FigmaImportPlans.admin?.components?.edit?.beforeDocumentControls ?? []).toEqual([])
    expect(FigmaImportPlans.fields[0]).toMatchObject({
      name: 'ownerActions', type: 'ui',
      admin: { components: { Field: './components/FigmaImportPlanControls#FigmaImportPlanControls' } },
    })
  })

  it('accepts only matching canonical plan provenance created for the owner', async () => {
    const data = { candidateName: 'Hero', candidateType: 'FRAME', createdBy: 1, nodeId: '1:2', plan, planHash: plan.hash, schemaVersion: 1, sourceFileKey: 'AbCdEf', status: 'pending' }
    await expect(prepareFigmaImportPlan({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(prepareFigmaImportPlan({ data: { ...data, candidateName: 'Otro' }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/procedencia|plan/i)
    await expect(prepareFigmaImportPlan({ data: { ...data, planHash: `sha256:${'0'.repeat(64)}` }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/hash|plan/i)
  })

  it('rejects updates, deletes, anonymous creation, and non-pending state', async () => {
    const data = { candidateName: 'Hero', candidateType: 'FRAME', createdBy: 1, nodeId: '1:2', plan, planHash: plan.hash, schemaVersion: 1, sourceFileKey: 'AbCdEf', status: 'pending' }
    await expect(prepareFigmaImportPlan({ data, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(prepareFigmaImportPlan({ data, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(prepareFigmaImportPlan({ data: { ...data, status: 'imported' }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/procedencia|plan/i)
    await expect(enforceFigmaImportPlanDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
