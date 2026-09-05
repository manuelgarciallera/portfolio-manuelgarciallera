import 'server-only'

import { createHash } from 'node:crypto'
import { APIError, commitTransaction, initTransaction, killTransaction } from 'payload'

import { isOwner } from '../../access/owner'
import { recordAuditEvent } from '../../collections/AuditEvents'
import { createFigmaImportExecution } from './import-execution'
import { hashFigmaImportPlan, type FigmaImportPlan } from './import-plan'
import { createFigmaImportReview, type FigmaImportDecision } from './import-review'
import { downloadFigmaRender } from './render-download'
import type { FigmaCandidate, FigmaReadProvider } from './types'
import { parseFigmaSource } from './url'

type Download = (url: string) => Promise<{ data: Buffer; mimeType: 'image/png'; size: number }>
type Payload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  find(args: Record<string, unknown>): Promise<{ docs: Array<Record<string, unknown>> }>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}
type TransactionRequest = { payload?: unknown; user?: unknown }
type Dependencies = { begin(req: TransactionRequest): Promise<boolean>; commit(req: TransactionRequest): Promise<void>; rollback(req: TransactionRequest): Promise<void> }
const transactionDefaults: Dependencies = {
  begin: (req) => initTransaction(req as never),
  commit: (req) => commitTransaction(req as never),
  rollback: (req) => killTransaction(req as never),
}

const id = (value: unknown, label: string): string | number => {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && ('id' in value) && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  throw new APIError(`${label} no tiene un identificador válido.`, 409)
}
const text = (value: unknown, label: string, maximum: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) throw new APIError(`${label} no es válido.`, 400)
  return value.trim()
}
const safeFilename = (value: string): string => {
  const base = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96)
  return `${base || 'figma-import'}.png`
}
const sameCandidate = (plan: FigmaImportPlan, candidate: FigmaCandidate, file: { name: string; lastModified?: string }) =>
  plan.file.name === file.name && plan.file.lastModified === file.lastModified &&
  plan.candidate.id === candidate.id && plan.candidate.name === candidate.name && plan.candidate.type === candidate.type &&
  plan.candidate.width === candidate.width && plan.candidate.height === candidate.height && plan.candidate.sourceUrl === candidate.sourceUrl

export const executeOwnerFigmaImport = async ({ alt, confirmation, dependencies = transactionDefaults, download = downloadFigmaRender, now = new Date().toISOString(), payload, provider, req, reviewId }: {
  alt: string; confirmation: string; dependencies?: Dependencies; download?: Download; now?: string; payload: Payload; provider: FigmaReadProvider; req: TransactionRequest; reviewId: string | number
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const ownerId = id(req.user.id, 'El owner')
  if (confirmation !== 'IMPORTAR PNG DE FIGMA') throw new APIError('La confirmación no coincide.', 400)
  const alternativeText = text(alt, 'El texto alternativo', 500)
  const existing = await payload.find({ collection: 'figma-import-executions', depth: 0, limit: 1, overrideAccess: false, req, where: { review: { equals: reviewId } } })
  if (existing.docs.length) throw new APIError('La revisión de Figma ya fue importada.', 409)

  const reviewDocument = await payload.findByID({ collection: 'figma-import-reviews', depth: 0, id: reviewId, overrideAccess: false, req })
  const planId = id(reviewDocument.plan, 'La revisión')
  let review
  try {
    review = createFigmaImportReview({
      decidedAt: reviewDocument.decidedAt, decidedBy: id(reviewDocument.decidedBy, 'El owner'),
      decision: reviewDocument.decision as FigmaImportDecision, note: reviewDocument.note,
      planHash: reviewDocument.planHash, planId,
    })
  } catch { throw new APIError('La revisión no supera la verificación de integridad.', 409) }
  if (reviewDocument.reviewHash !== review.hash || review.decision !== 'approved') throw new APIError('La revisión no está aprobada o no supera la verificación de integridad.', 409)

  const planDocument = await payload.findByID({ collection: 'figma-import-plans', depth: 0, id: planId, overrideAccess: false, req })
  const plan = planDocument.plan as FigmaImportPlan
  let planHash: string
  try { planHash = hashFigmaImportPlan(plan) } catch { throw new APIError('El plan no supera la verificación de integridad.', 409) }
  if (planDocument.planHash !== planHash || review.planHash !== planHash) throw new APIError('El hash del plan no coincide con la revisión.', 409)

  let source
  try { source = parseFigmaSource(plan.candidate.sourceUrl) } catch { throw new APIError('La fuente aprobada de Figma no es válida.', 409) }
  const discovered = await provider.discover(source)
  if (!discovered.ok) throw new APIError('No se pudo verificar de nuevo el nodo aprobado de Figma.', discovered.code === 'rate_limited' ? 429 : discovered.code === 'disabled' ? 503 : 502)
  const candidate = discovered.candidates.find((item) => item.id === plan.candidate.id)
  if (!candidate || !sameCandidate(plan, candidate, discovered.file)) throw new APIError('El nodo aprobado de Figma ha cambiado; prepara un plan nuevo.', 409)
  if (!candidate.preview?.url) throw new APIError('Figma no devolvió un render PNG disponible.', 409)

  let rendered
  try { rendered = await download(candidate.preview.url) } catch { throw new APIError('No se pudo descargar el render PNG verificado.', 502) }
  const contentHash = `sha256:${createHash('sha256').update(rendered.data).digest('hex')}`
  const started = await dependencies.begin(req)
  if (!started) throw new APIError('No se pudo abrir una transacción de importación.', 503)
  try {
    const raced = await payload.find({ collection: 'figma-import-executions', depth: 0, limit: 1, overrideAccess: false, req, where: { review: { equals: reviewId } } })
    if (raced.docs.length) throw new APIError('La revisión de Figma ya fue importada.', 409)
    const media = await payload.create({
      collection: 'media',
      data: { _status: 'draft', alt: alternativeText, credit: `Figma · ${plan.file.name} · ${plan.candidate.name}` },
      file: { data: rendered.data, mimetype: rendered.mimeType, name: safeFilename(plan.candidate.name), size: rendered.size },
      overrideAccess: true,
      req,
    })
    const mediaId = id(media, 'El medio')
    const placement = await payload.create({
      collection: 'media-placements',
      data: { _status: 'draft', name: `${plan.candidate.name} · encuadre`, placement: { asset: mediaId } },
      overrideAccess: true,
      req,
    })
    const placementId = id(placement, 'El encuadre')
    const execution = createFigmaImportExecution({ contentHash, importedAt: now, importedBy: ownerId, mediaId, mimeType: rendered.mimeType, placementId, planHash, planId, reviewHash: review.hash, reviewId, size: rendered.size })
    const created = await payload.create({
      collection: 'figma-import-executions',
      data: { contentHash, executionHash: execution.hash, importedAt: execution.importedAt, importedBy: ownerId, media: mediaId, mimeType: execution.mimeType, placement: placementId, plan: planId, planHash, review: reviewId, reviewHash: review.hash, schemaVersion: execution.schemaVersion, size: execution.size },
      overrideAccess: true,
      req,
    })
    await recordAuditEvent({
      input: { action: 'figma.import.executed', metadata: { contentHash, mediaId, placementId, planHash, reviewHash: review.hash, size: rendered.size }, outcome: 'success', subject: { collection: 'figma-import-executions', id: id(created, 'La importación') } },
      payload: payload as never, req, user: req.user,
    })
    await dependencies.commit(req)
    return created
  } catch (error) {
    try { await dependencies.rollback(req) } catch { /* preserve original import failure */ }
    throw error
  }
}
