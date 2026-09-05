import { APIError } from 'payload'
import { isOwner } from '../access/owner'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import { ASSIST_CAPABILITIES, validateStudioPatch, type AssistCapabilitySwitches, type StudioPatchContext } from './contracts'
import type { AssistanceReview, AssistanceReviewValue } from './review-types'

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new APIError('La comparación no es válida.', 400)
  return value as Record<string, unknown>
}
const idOf = (value: unknown): string => {
  const id = typeof value === 'object' && value !== null ? record(value).id : value
  if ((typeof id !== 'string' && typeof id !== 'number') || !/^[A-Za-z0-9_-]{1,64}$/.test(String(id))) throw new APIError('Identificador no válido.', 400)
  return String(id)
}
const unknownValue: AssistanceReviewValue = { state: 'not-captured', text: 'No guardado en esta versión' }
const removedValue: AssistanceReviewValue = { state: 'removed', text: 'Campo eliminado' }
const valueText = (value: unknown): AssistanceReviewValue => ({
  state: 'captured', text: value === '' ? 'Texto vacío' : value === null ? 'Sin valor' : String(value),
})
const blockOrder = (value: unknown): AssistanceReviewValue => ({
  state: 'captured',
  text: (value as Record<string, unknown>[]).map((block, index) => {
    const title = typeof block.heading === 'string' ? block.heading : typeof block.caption === 'string' ? block.caption : ''
    return `${index + 1}. ${String(block.blockType)}${block.id ? ` [${String(block.id)}]` : ''}${title ? ` — ${title}` : ''}`
  }).join('\n'),
})
const labels: Record<string, string> = {
  heading: 'Titular', caption: 'Pie de imagen', duration: 'Duración (ms)', stagger: 'Intervalo (ms)',
  travel: 'Recorrido (px)', easing: 'Curva', reducedMotion: 'Movimiento reducido',
  focalX: 'Punto focal horizontal', focalY: 'Punto focal vertical', zoom: 'Zoom', fit: 'Ajuste', frame: 'Proporción',
}

export const loadOwnerAssistanceReview = async ({ payload, req, proposalId }: {
  payload: { findByID(args: Record<string, unknown>): Promise<unknown> }
  req: { user?: unknown }
  proposalId: string | number
}): Promise<AssistanceReview> => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const requestedId = idOf(proposalId)
  const proposal = record(await payload.findByID({ collection: 'assistance-proposals', id: proposalId, depth: 0, overrideAccess: false, req }))
  if (idOf(proposal) !== requestedId) throw new APIError('La propuesta no coincide.', 400)
  const snapshotId = idOf(proposal.sourceSnapshot)
  const snapshot = record(await payload.findByID({ collection: 'preview-snapshots', id: typeof proposal.sourceSnapshot === 'object' ? record(proposal.sourceSnapshot).id : proposal.sourceSnapshot, depth: 0, overrideAccess: false, req }))
  if (idOf(snapshot) !== snapshotId) throw new APIError('El snapshot no coincide.', 400)
  const manifest = snapshot.manifest as PreviewManifest
  const snapshotHash = hashPreviewManifest(manifest)
  if (snapshot.manifestHash !== snapshotHash || idOf(proposal.targetPage) !== manifest.source.documentId) throw new APIError('La versión no coincide con la propuesta.', 400)
  const brand = record(manifest.brandTokens)
  const context: StudioPatchContext = {
    // Older captures lack the title. An empty fallback permits structural
    // validation only; the comparison below keeps that baseline unknown.
    page: { title: manifest.pageTitle ?? '', layout: manifest.pageBlocks as StudioPatchContext['page']['layout'] },
    brand: { colors: brand.colors as StudioPatchContext['brand']['colors'], usageWeights: brand.usageWeights as StudioPatchContext['brand']['usageWeights'], motion: brand.motion as StudioPatchContext['brand']['motion'] },
  }
  // A historical, read-only comparison remains readable when a capability is
  // switched off. This does not authorize creation, acceptance, or application.
  const readable = Object.fromEntries(ASSIST_CAPABILITIES.map((key) => [key, true])) as AssistCapabilitySwitches
  const patch = validateStudioPatch(proposal.patch, readable, context)
  if (patch.capability !== proposal.capability) throw new APIError('La capacidad no coincide.', 400)
  const previous = new Map<string, AssistanceReviewValue>()
  const changes = patch.operations.map((operation) => {
    const { path } = operation
    let before = unknownValue
    let label = 'Título de página'
    if (path === '/page/title' && typeof manifest.pageTitle === 'string') {
      before = valueText(manifest.pageTitle)
    } else if (path === '/page/layout') {
      before = blockOrder(context.page.layout)
      label = 'Orden de los bloques'
    } else if (path.startsWith('/page/layout/')) {
      const [, , , index, field] = path.split('/')
      before = valueText(context.page.layout[Number(index)][field])
      label = `Bloque ${Number(index) + 1}: ${labels[field]}`
    } else if (path.startsWith('/brand/colors/') || path.startsWith('/brand/usageWeights/')) {
      const [, , field, index, key] = path.split('/')
      const entry = (field === 'colors' ? context.brand.colors : context.brand.usageWeights)[Number(index)]
      before = valueText((entry as unknown as Record<string, unknown>)[key])
      label = `${field === 'colors' ? 'Color' : 'Proporción de color (%)'}: ${entry.role}`
    } else if (path.startsWith('/brand/motion/')) {
      const field = path.split('/')[3]
      before = valueText(context.brand.motion[field])
      label = labels[field]
    } else if (path.startsWith('/media-placements/')) {
      const [, , id, , field] = path.split('/')
      const captured = manifest.mediaPlacements?.find((entry) => entry.id === id)
      if (captured) before = valueText((captured.placement as unknown as Record<string, unknown>)[field])
      label = `Imagen ${id}: ${labels[field]}`
    }
    const proposed = operation.op === 'remove' ? removedValue : path === '/page/layout' ? blockOrder(operation.value) : valueText(operation.value)
    const change = { path, label, operation: operation.op, before: previous.get(path) ?? before, proposed }
    previous.set(path, proposed)
    return change
  })
  return { proposalId: requestedId, snapshotHash, appliesChanges: false, changes }
}
