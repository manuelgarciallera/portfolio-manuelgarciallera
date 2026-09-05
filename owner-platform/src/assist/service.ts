import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import { ASSIST_CAPABILITIES, type AssistCapabilitySwitches, type StudioPatchContext } from './contracts'
import { createProposalData, decideProposalData } from './proposal'
import { buildAssistanceContextPackage } from './context'

type AssistancePayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findGlobal?(args: Record<string, unknown>): Promise<Record<string, unknown>>
  update?(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new APIError(`${label} no es válido.`, 400)
  }
  return value as Record<string, unknown>
}

const relationId = (value: unknown, label: string): string | number => {
  if (typeof value === 'string' || typeof value === 'number') return value
  const expanded = record(value, label)
  if (typeof expanded.id === 'string' || typeof expanded.id === 'number') return expanded.id
  throw new APIError(`${label} no tiene identificador.`, 400)
}

export const createOwnerAssistanceContext = async ({
  payload,
  req,
  sourceSnapshot,
}: {
  payload: AssistancePayload
  req: { user?: unknown }
  sourceSnapshot: string | number
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (!payload.findGlobal) throw new APIError('Los permisos del asistente no están disponibles.', 500)
  const snapshot = record(await payload.findByID({
    collection: 'preview-snapshots',
    depth: 0,
    id: sourceSnapshot,
    overrideAccess: false,
    req,
  }), 'El snapshot')
  const manifest = snapshot.manifest as PreviewManifest
  let verifiedHash: string
  try { verifiedHash = hashPreviewManifest(manifest) }
  catch { throw new APIError('El manifiesto del snapshot no supera la verificación de hash.', 400) }
  if (snapshot.manifestHash !== verifiedHash) throw new APIError('El snapshot no coincide con su manifiesto.', 400)
  const settings = record(await payload.findGlobal({ slug: 'assistant-settings', depth: 0, overrideAccess: false, req }), 'Los permisos del asistente')
  const switches = Object.fromEntries(ASSIST_CAPABILITIES.map((capability) => [capability, settings[capability] === true])) as AssistCapabilitySwitches
  const contextPackage = buildAssistanceContextPackage(manifest, switches)
  await recordAuditEvent({
    input: {
      action: 'assistant.context.exported',
      metadata: { snapshotHash: verifiedHash },
      outcome: 'success',
      subject: { collection: 'preview-snapshots', id: relationId(snapshot, 'El snapshot') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return contextPackage
}

export const createOwnerAssistanceProposal = async ({
  patch,
  payload,
  provider,
  req,
  sourceSnapshot,
}: {
  patch: unknown
  payload: AssistancePayload
  provider: string
  req: { user?: unknown }
  sourceSnapshot: string | number
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (!payload.findGlobal) throw new APIError('Los permisos del asistente no están disponibles.', 500)
  const snapshot = record(
    await payload.findByID({
      collection: 'preview-snapshots',
      depth: 0,
      id: sourceSnapshot,
      overrideAccess: false,
      req,
    }),
    'El snapshot',
  )
  const manifest = snapshot.manifest as PreviewManifest
  let verifiedHash: string
  try {
    verifiedHash = hashPreviewManifest(manifest)
  } catch {
    throw new APIError('El manifiesto del snapshot no supera la verificación de hash.', 400)
  }
  if (snapshot.manifestHash !== verifiedHash) {
    throw new APIError('El snapshot no coincide con su manifiesto.', 400)
  }
  const pageId = manifest.source.documentId
  const page = record(
    await payload.findByID({
      collection: 'pages',
      depth: 0,
      draft: true,
      id: pageId,
      overrideAccess: false,
      req,
    }),
    'La página',
  )
  if (typeof page.title !== 'string') throw new APIError('La página no tiene un título válido.', 400)
  const storedPageId = relationId(page, 'La página')
  if (String(storedPageId) !== String(pageId)) throw new APIError('La página no coincide con el snapshot.', 400)
  const settings = record(
    await payload.findGlobal({ slug: 'assistant-settings', depth: 0, overrideAccess: false, req }),
    'Los permisos del asistente',
  )
  const switches = Object.fromEntries(
    ASSIST_CAPABILITIES.map((capability) => [capability, settings[capability] === true]),
  ) as AssistCapabilitySwitches
  const brand = record(manifest.brandTokens, 'La marca del snapshot')
  const context: StudioPatchContext = {
    page: { title: page.title, layout: manifest.pageBlocks as StudioPatchContext['page']['layout'] },
    brand: {
      colors: brand.colors as StudioPatchContext['brand']['colors'],
      motion: brand.motion as StudioPatchContext['brand']['motion'],
      usageWeights: brand.usageWeights as StudioPatchContext['brand']['usageWeights'],
    },
  }
  const data = createProposalData(
    { patch, provider, sourceSnapshot: relationId(snapshot, 'El snapshot'), targetPage: storedPageId },
    req.user,
    switches,
    context,
  )
  const proposal = await payload.create({
    collection: 'assistance-proposals',
    data,
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: 'assistant.proposal.created',
      metadata: { capability: data.capability, provider, snapshotHash: verifiedHash },
      outcome: 'success',
      subject: { collection: 'assistance-proposals', id: relationId(proposal, 'La propuesta') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return proposal
}

export const decideOwnerAssistanceProposal = async ({
  decision,
  note,
  now,
  payload,
  proposalId,
  req,
}: {
  decision: 'accepted' | 'rejected'
  note?: string
  now?: string
  payload: AssistancePayload
  proposalId: string | number
  req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (!payload.update) throw new APIError('El servicio de decisión no está disponible.', 500)
  const proposal = record(
    await payload.findByID({
      collection: 'assistance-proposals',
      depth: 0,
      id: proposalId,
      overrideAccess: false,
      req,
    }),
    'La propuesta',
  )
  const data = decideProposalData(
    { status: proposal.status },
    { decision, note },
    req.user,
    now,
  )
  const updated = await payload.update({
    collection: 'assistance-proposals',
    data,
    id: proposalId,
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: `assistant.proposal.${decision}`,
      metadata: {
        ...(typeof note === 'string' && note.trim() ? { decisionNote: note.trim() } : {}),
        targetPage: proposal.targetPage,
      },
      outcome: 'success',
      subject: { collection: 'assistance-proposals', id: relationId(proposal, 'La propuesta') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return updated
}
