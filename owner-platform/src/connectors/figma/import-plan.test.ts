import { describe, expect, it } from 'vitest'

import { createFigmaImportPlan, hashFigmaImportPlan } from './import-plan'

describe('Figma import plan', () => {
  it('captures a detached immutable selection without persisting the temporary render URL', () => {
    const plan = createFigmaImportPlan({
      candidate: {
        id: '12:34', name: 'Hero desktop', type: 'FRAME', width: 1440, height: 900,
        sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=12-34',
        preview: { url: 'https://s3-alpha.figma.com/signed/render.png?signature=temporary', expiresAfterDays: 30 },
      },
      file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' },
      observedAt: '2026-09-05T05:00:00.000Z',
      source: { fileKey: 'AbCdEf', sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio' },
    })

    expect(plan).toMatchObject({
      schemaVersion: 1,
      source: { fileKey: 'AbCdEf', sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio' },
      file: { name: 'Portfolio', lastModified: '2026-09-05T04:00:00.000Z' },
      candidate: { id: '12:34', name: 'Hero desktop', type: 'FRAME', width: 1440, height: 900, sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=12-34' },
      preview: { available: true, observedAt: '2026-09-05T05:00:00.000Z', refreshRequired: true },
    })
    expect(JSON.stringify(plan)).not.toContain('signature=temporary')
    expect(hashFigmaImportPlan(plan)).toBe(plan.hash)
    expect(Object.isFrozen(plan.candidate)).toBe(true)
  })

  it('rejects forged, malformed, or unbounded selection evidence', () => {
    const valid = createFigmaImportPlan({
      candidate: { id: '1:2', name: 'Hero', type: 'COMPONENT', sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=1-2' },
      file: { name: 'Portfolio' },
      observedAt: '2026-09-05T05:00:00.000Z',
      source: { fileKey: 'AbCdEf', nodeId: '1:2', sourceUrl: 'https://www.figma.com/design/AbCdEf/Portfolio?node-id=1-2' },
    })
    expect(() => hashFigmaImportPlan({ ...valid, candidate: { ...valid.candidate, name: 'Otro' } })).toThrow(/hash/i)
    expect(() => createFigmaImportPlan({ ...valid, candidate: { ...valid.candidate, id: '../1' } } as never)).toThrow()
    expect(() => createFigmaImportPlan({ ...valid, candidate: { ...valid.candidate, name: 'x'.repeat(241) } } as never)).toThrow()
  })
})
