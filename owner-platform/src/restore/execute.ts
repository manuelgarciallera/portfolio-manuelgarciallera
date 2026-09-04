import { APIError, commitTransaction, initTransaction, killTransaction } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { createPagePreviewSnapshot } from '../preview/service'
import { createPageDraftSnapshot } from '../recovery/service'
import { executeRestorePlanData } from './plan'
import { verifiedDraftSnapshot, verifiedSnapshot, type RestorePayload } from './service'

type TransactionRequest = { payload?: unknown; user?: unknown }
type ExecuteDependencies = {
  begin(req: TransactionRequest): Promise<boolean>
  commit(req: TransactionRequest): Promise<void>
  rollback(req: TransactionRequest): Promise<void>
  createDraft(args: { pageId: string | number; payload: RestorePayload; req: TransactionRequest }): Promise<Record<string, unknown>>
  createPreview(args: { pageId: string | number; payload: RestorePayload; req: TransactionRequest }): Promise<Record<string, unknown>>
}

const defaults: ExecuteDependencies = {
  begin: (req) => initTransaction(req as never),
  commit: (req) => commitTransaction(req as never),
  rollback: (req) => killTransaction(req as never),
  createDraft: (args) => createPageDraftSnapshot(args as never) as never,
  createPreview: (args) => createPagePreviewSnapshot(args as never) as never,
}

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new APIError(`${label} no es válido.`, 400)
  return value as Record<string, unknown>
}

const relationId = (value: unknown, label: string): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  const expanded = record(value, label)
  if ((typeof expanded.id === 'string' || typeof expanded.id === 'number') && String(expanded.id).trim()) return expanded.id
  throw new APIError(`${label} no tiene identificador.`, 400)
}

export const executeOwnerRestorePlan = async ({
  confirmation,
  dependencies = defaults,
  now,
  payload,
  planId,
  req,
}: {
  confirmation: string
  dependencies?: ExecuteDependencies
  now?: string
  payload: RestorePayload
  planId: string | number
  req: TransactionRequest
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (confirmation !== 'EJECUTAR RESTAURACIÓN') throw new APIError('La confirmación de ejecución no coincide.', 400)
  if (!payload.update) throw new APIError('La ejecución de restauración no está disponible.', 500)

  const plan = record(await payload.findByID({
    collection: 'restore-plans', depth: 0, id: planId, overrideAccess: false, req,
  }), 'El plan')
  if (plan.status !== 'confirmed') throw new APIError('Solo puede ejecutarse un plan confirmado.', 409)
  const pageId = relationId(plan.targetPage, 'La página objetivo')
  const target = await verifiedDraftSnapshot(payload, req, relationId(plan.targetDraftSnapshot, 'El snapshot objetivo'))
  if (target.capsuleHash !== plan.targetCapsuleHash || target.capsule.source.documentId !== String(pageId)) {
    throw new APIError('La cápsula objetivo no coincide con el plan confirmado.', 409)
  }
  const confirmationSnapshot = await verifiedSnapshot(
    payload,
    req,
    relationId(plan.confirmationSnapshot, 'El snapshot de confirmación'),
  )
  if (confirmationSnapshot.manifest.source.documentId !== String(pageId)) {
    throw new APIError('El snapshot confirmado no pertenece a la página objetivo.', 409)
  }

  const started = await dependencies.begin(req)
  if (!started) throw new APIError('No se pudo abrir una transacción exclusiva de restauración.', 503)
  try {
    const page = record(await payload.findByID({
      collection: 'pages', depth: 0, draft: true, id: pageId, overrideAccess: false, req,
    }), 'La página')
    const currentVersionId = `current:${String(page.updatedAt)}`
    if (currentVersionId !== confirmationSnapshot.manifest.source.versionId) {
      throw new APIError('La página cambió después de confirmar el plan; crea uno nuevo.', 409)
    }
    const updateResult = record(await payload.update({
      collection: 'pages',
      data: target.capsule.state,
      draft: true,
      overrideAccess: false,
      req,
      where: { and: [{ id: { equals: pageId } }, { updatedAt: { equals: page.updatedAt } }] },
    }), 'El resultado de restauración')
    if (!Array.isArray(updateResult.docs) || updateResult.docs.length !== 1) {
      throw new APIError('La página cambió durante la restauración; la transacción se ha cancelado.', 409)
    }
    const resultDraft = await dependencies.createDraft({ pageId, payload, req })
    const resultPreview = await dependencies.createPreview({ pageId, payload, req })
    const resultCapsule = record(resultDraft.capsule, 'La cápsula resultante')
    const source = record(resultCapsule.source, 'La procedencia resultante')
    const data = executeRestorePlanData(
      { status: plan.status },
      {
        confirmation,
        resultDraftSnapshot: relationId(resultDraft, 'El snapshot de borrador resultante'),
        resultPreviewSnapshot: relationId(resultPreview, 'El snapshot visual resultante'),
        resultVersionId: source.versionId,
      },
      req.user as { id?: unknown },
      now,
    )
    const updatedPlan = await payload.update({
      collection: 'restore-plans', data, id: planId, overrideAccess: true, req,
    })
    await recordAuditEvent({
      input: {
        action: 'restore.executed',
        metadata: {
          resultDraftSnapshot: data.resultDraftSnapshot,
          resultPreviewSnapshot: data.resultPreviewSnapshot,
          resultVersionId: data.resultVersionId,
          targetCapsuleHash: target.capsuleHash,
        },
        outcome: 'success',
        subject: { collection: 'restore-plans', id: relationId(plan, 'El plan') },
      },
      payload: payload as never,
      req,
      user: req.user,
    })
    await dependencies.commit(req)
    return updatedPlan
  } catch (error) {
    try { await dependencies.rollback(req) } catch { /* preserve original restoration failure */ }
    throw error
  }
}
