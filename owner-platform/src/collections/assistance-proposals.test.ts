import { APIError, type Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  AssistanceProposals,
  enforceAssistanceProposalDelete,
  prepareAssistanceProposal,
} from './AssistanceProposals'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const fieldNamed = (name: string): Field | undefined =>
  AssistanceProposals.fields.find((field) => 'name' in field && field.name === name)

const proposal = {
  capability: 'suggestCopy',
  createdBy: 1,
  patch: {
    capability: 'suggestCopy',
    operations: [{ op: 'replace', path: '/page/title', value: 'Nuevo' }],
    schemaVersion: 1,
  },
  provider: 'codex',
  sourceSnapshot: 12,
  status: 'pending',
  targetPage: 7,
}

describe('AssistanceProposals collection', () => {
  it('is service-created, owner-readable, service-decided and never deletable', () => {
    expect(AssistanceProposals.slug).toBe('assistance-proposals')
    expect(AssistanceProposals.access?.create?.(accessArgs(owner))).toBe(false)
    expect(AssistanceProposals.access?.read?.(accessArgs(owner))).toBe(true)
    expect(AssistanceProposals.access?.read?.(accessArgs(null))).toBe(false)
    expect(AssistanceProposals.access?.update?.(accessArgs(owner))).toBe(false)
    expect(AssistanceProposals.access?.delete?.(accessArgs(owner))).toBe(false)
    expect(AssistanceProposals.admin?.components?.edit?.beforeDocumentControls).toEqual([
      './components/AssistanceProposalControls#AssistanceProposalControls',
    ])
  })

  it('stores proposal provenance and decision evidence without apply or publish controls', () => {
    expect(fieldNamed('targetPage')).toMatchObject({ type: 'relationship', relationTo: 'pages', required: true })
    expect(fieldNamed('sourceSnapshot')).toMatchObject({ type: 'relationship', relationTo: 'preview-snapshots', required: true })
    expect(fieldNamed('patch')).toMatchObject({ type: 'json', required: true })
    expect(fieldNamed('status')).toMatchObject({ type: 'select', required: true })
    expect(fieldNamed('createdBy')).toMatchObject({ type: 'relationship', relationTo: 'users', required: true })
    expect(fieldNamed('decidedBy')).toMatchObject({ type: 'relationship', relationTo: 'users' })
    expect(JSON.stringify(AssistanceProposals.fields)).not.toMatch(/(?:apply|publish|deploy|productionWrite)/i)
  })

  it('accepts trusted pending creation and a single bounded decision transition', async () => {
    await expect(
      prepareAssistanceProposal({ operation: 'create', data: proposal, req: { user: owner } } as never),
    ).resolves.toEqual(proposal)
    await expect(
      prepareAssistanceProposal({
        operation: 'update',
        data: { status: 'accepted', decisionNote: 'Revisado', decidedAt: '2026-09-04T20:00:00.000Z', decidedBy: 1 },
        originalDoc: proposal,
        req: { user: owner },
      } as never),
    ).resolves.toMatchObject({ status: 'accepted', decidedBy: 1 })
  })

  it('rejects patch mutation, repeated decisions, forged actors and deletion', async () => {
    await expect(
      prepareAssistanceProposal({ operation: 'update', data: { patch: {} }, originalDoc: proposal, req: { user: owner } } as never),
    ).rejects.toBeInstanceOf(APIError)
    await expect(
      prepareAssistanceProposal({ operation: 'update', data: { status: 'rejected', decidedBy: 1 }, originalDoc: { ...proposal, status: 'accepted' }, req: { user: owner } } as never),
    ).rejects.toBeInstanceOf(APIError)
    await expect(
      prepareAssistanceProposal({ operation: 'create', data: { ...proposal, createdBy: 2 }, req: { user: owner } } as never),
    ).rejects.toBeInstanceOf(APIError)
    await expect(enforceAssistanceProposalDelete({} as never)).rejects.toBeInstanceOf(APIError)
  })

  it('accepts Payload merged fields and timestamps while preserving immutable content', async () => {
    const original = { ...proposal, decisionNote: null, decidedAt: null, decidedBy: null, createdAt: '2026-09-04T19:00:00.000Z' }
    const data = { ...structuredClone(original), status: 'accepted', decidedBy: 1, decidedAt: '2026-09-04T20:00:00.000Z', updatedAt: '2026-09-04T20:00:00.000Z' }
    await expect(prepareAssistanceProposal({ operation: 'update', data, originalDoc: original, req: { user: owner } } as never)).resolves.toEqual(data)
    for (const mutation of [{ targetPage: 8 }, { patch: {} }, { provider: null }, { createdBy: 2 }, { createdAt: '2020-01-01T00:00:00.000Z' }]) {
      await expect(prepareAssistanceProposal({ operation: 'update', data: { ...data, ...mutation }, originalDoc: original, req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
    }
  })
})
