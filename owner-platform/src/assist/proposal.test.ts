import { describe, expect, it } from 'vitest'

import { createProposalData, decideProposalData } from './proposal'
import type { AssistCapabilitySwitches, StudioPatchContext } from './contracts'

const switches: AssistCapabilitySwitches = {
  suggestCopy: true,
  suggestPalette: false,
  suggestLayout: false,
  suggestCrop: false,
  suggestMotion: false,
}
const context: StudioPatchContext = {
  page: { title: 'Inicio', layout: [{ blockType: 'hero', heading: 'Hola' }] },
  brand: {
    colors: [{ role: 'accent', value: '#FF4B44' }],
    motion: { duration: 600 },
    usageWeights: [{ role: 'accent', weight: 100 }],
  },
}
const patch = {
  capability: 'suggestCopy',
  operations: [{ op: 'replace', path: '/page/title', value: 'Nuevo título' }],
  schemaVersion: 1,
}

describe('assistance proposal lifecycle', () => {
  it('creates a pending detached proposal bound to a preview snapshot and owner', () => {
    const input = { patch, provider: 'codex', sourceSnapshot: 12, targetPage: 7 }
    const result = createProposalData(input, { id: 1 }, switches, context)
    input.patch.operations[0].value = 'Manipulado'
    expect(result).toEqual({
      capability: 'suggestCopy',
      createdBy: 1,
      patch: {
        capability: 'suggestCopy',
        operations: [{ op: 'replace', path: '/page/title', value: 'Nuevo título' }],
        schemaVersion: 1,
      },
      provider: 'codex',
      sourceSnapshot: 12,
      status: 'pending',
      targetPage: 7,
    })
  })

  it('respects disabled capability switches before anything is persisted', () => {
    expect(() =>
      createProposalData(
        { ...patch, capability: 'suggestPalette' } as never,
        { id: 1 },
        switches,
        context,
      ),
    ).toThrow()
    expect(() =>
      createProposalData(
        {
          patch: { ...patch, capability: 'suggestPalette' },
          provider: 'codex',
          sourceSnapshot: 12,
          targetPage: 7,
        },
        { id: 1 },
        switches,
        context,
      ),
    ).toThrow(/desactivada/i)
  })

  it.each(['', '../openai', 'api_key', 'codex<script>', 'x'.repeat(65)])(
    'rejects unsafe provider identifier %s',
    (provider) => {
      expect(() =>
        createProposalData({ patch, provider, sourceSnapshot: 12, targetPage: 7 }, { id: 1 }, switches, context),
      ).toThrow(/provider/i)
    },
  )

  it('creates an explicit irreversible decision record without applying the patch', () => {
    expect(
      decideProposalData(
        { status: 'pending' },
        { decision: 'accepted', note: 'Revisado en preview' },
        { id: 1 },
        '2026-09-04T20:00:00.000Z',
      ),
    ).toEqual({
      decidedAt: '2026-09-04T20:00:00.000Z',
      decidedBy: 1,
      decisionNote: 'Revisado en preview',
      status: 'accepted',
    })
  })

  it('rejects repeated, invalid or oversized decisions', () => {
    expect(() => decideProposalData({ status: 'accepted' }, { decision: 'rejected' }, { id: 1 })).toThrow(/pendiente/i)
    expect(() => decideProposalData({ status: 'pending' }, { decision: 'published' } as never, { id: 1 })).toThrow()
    expect(() => decideProposalData({ status: 'pending' }, { decision: 'rejected', note: 'x'.repeat(1001) }, { id: 1 })).toThrow()
  })
})
