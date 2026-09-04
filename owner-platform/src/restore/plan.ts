export const RESTORE_PLAN_STATUSES = ['ready', 'confirmed', 'conflict'] as const

const CREATE_FIELDS = new Set([
  'baselineHash',
  'baselineSnapshot',
  'confirmation',
  'release',
  'targetHash',
  'targetPage',
  'targetSnapshot',
])
const CONFIRM_FIELDS = new Set(['confirmation', 'currentHash', 'currentSnapshot'])
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const relation = (value: unknown, label: string): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) {
    throw new TypeError(`${label} no es válido.`)
  }
  return value
}

const hash = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) throw new TypeError(`${label} no es válido.`)
  return value
}

const timestamp = (value: string): string => {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new TypeError('La fecha no es válida.')
  }
  return value
}

export const createRestorePlanData = (input: unknown, actor: { id?: unknown }) => {
  if (!isRecord(input)) throw new TypeError('El plan debe ser un objeto.')
  const unknown = Object.keys(input).find((key) => !CREATE_FIELDS.has(key))
  if (unknown) throw new TypeError(`El plan contiene un campo no permitido: ${unknown}.`)
  if (input.confirmation !== 'PREPARAR RESTAURACIÓN') {
    throw new TypeError('La primera confirmación no coincide.')
  }
  return {
    baselineHash: hash(input.baselineHash, 'El hash base'),
    baselineSnapshot: relation(input.baselineSnapshot, 'El snapshot base'),
    createdBy: relation(actor.id, 'El owner'),
    release: relation(input.release, 'La versión'),
    status: 'ready' as const,
    targetHash: hash(input.targetHash, 'El hash objetivo'),
    targetPage: relation(input.targetPage, 'La página'),
    targetSnapshot: relation(input.targetSnapshot, 'El snapshot objetivo'),
  }
}

export const confirmRestorePlanData = (
  current: { baselineHash?: unknown; status?: unknown },
  input: unknown,
  actor: { id?: unknown },
  now = new Date().toISOString(),
) => {
  if (current.status !== 'ready') throw new TypeError('Solo puede confirmarse un plan preparado (ready).')
  if (!isRecord(input)) throw new TypeError('La confirmación debe ser un objeto.')
  const unknown = Object.keys(input).find((key) => !CONFIRM_FIELDS.has(key))
  if (unknown) throw new TypeError(`La confirmación contiene un campo no permitido: ${unknown}.`)
  if (input.confirmation !== 'CONFIRMAR RESTAURACIÓN') {
    throw new TypeError('La segunda confirmación no coincide.')
  }
  const baselineHash = hash(current.baselineHash, 'El hash base')
  const currentHash = hash(input.currentHash, 'El hash actual')
  const common = {
    confirmedAt: timestamp(now),
    confirmedBy: relation(actor.id, 'El owner'),
    confirmationSnapshot: relation(input.currentSnapshot, 'El snapshot de confirmación'),
  }
  return currentHash === baselineHash
    ? { ...common, status: 'confirmed' as const }
    : { ...common, conflictHash: currentHash, status: 'conflict' as const }
}
