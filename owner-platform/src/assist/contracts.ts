export const ASSIST_CAPABILITIES = [
  'suggestCopy',
  'suggestPalette',
  'suggestLayout',
  'suggestCrop',
  'suggestMotion',
] as const

export type AssistCapability = (typeof ASSIST_CAPABILITIES)[number]
export type AssistCapabilitySwitches = Readonly<Record<AssistCapability, boolean>>

export const STUDIO_PATCH_LIMITS = Object.freeze({
  maxOperations: 32,
  maxValueDepth: 8,
  maxStringLength: 4_000,
  maxSerializedBytes: 64 * 1024,
  maxArrayLength: 64,
})

export type StudioPatchOperation = Readonly<{
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: unknown
}>

export type StudioPatch = Readonly<{
  schemaVersion: 1
  capability: AssistCapability
  operations: readonly StudioPatchOperation[]
}>

export type AssistDecision =
  | Readonly<{ allowed: true; capability: AssistCapability; patch: StudioPatch }>
  | Readonly<{ allowed: false; capability?: AssistCapability; reason: string }>

const capabilityPaths: Readonly<Record<AssistCapability, readonly RegExp[]>> = Object.freeze({
  suggestCopy: [/^\/page\/(title|summary)$/, /^\/page\/blocks\/(0|[1-9]\d*)\/(heading|body)$/],
  suggestPalette: [
    /^\/brand\/colors\/(background|surface|text|mutedText|accent|interaction|success|danger)$/,
    /^\/brand\/usageWeights\/(background|surface|text|mutedText|accent|interaction|success|danger)$/,
  ],
  suggestLayout: [/^\/page\/blocks\/(0|[1-9]\d*)\/layout\/(variant|alignment)$/],
  suggestCrop: [/^\/page\/blocks\/(0|[1-9]\d*)\/(mediaId|mediaUrl)$/, /^\/page\/blocks\/(0|[1-9]\d*)\/crop\/(x|y|zoom)$/],
  suggestMotion: [/^\/brand\/motion\/(duration|stagger|travel|easing|reducedMotion)$/],
})

const blockedKey = /(?:^__proto__$|^prototype$|^constructor$|^script$|^javascript$|^html$|^css$|^on[a-z]+$|secret|token|password|authorization|credential|private[-_]?key|api[-_]?key|cookie|session)/i
const assistCapabilitySet = new Set<string>(ASSIST_CAPABILITIES)
const allowedPatchKeys = new Set(['schemaVersion', 'capability', 'operations'])
const allowedOperationKeys = new Set(['op', 'path', 'value'])

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

const assertSafeValue = (value: unknown, depth = 0, ancestors = new Set<object>()): void => {
  if (depth > STUDIO_PATCH_LIMITS.maxValueDepth) throw new TypeError('La profundidad máxima del valor ha sido excedida.')
  if (value === null || typeof value === 'boolean') return
  if (typeof value === 'string') {
    if (value.length > STUDIO_PATCH_LIMITS.maxStringLength) throw new TypeError('El texto de una operación es demasiado largo.')
    return
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Solo se admiten números JSON finitos.')
    return
  }
  if (!value || typeof value !== 'object') throw new TypeError('Solo se admiten valores JSON.')
  if (ancestors.has(value)) throw new TypeError('No se admiten referencias cíclicas.')
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) throw new TypeError('Solo se admiten objetos JSON planos.')
  const next = new Set(ancestors).add(value)
  if (Array.isArray(value)) {
    if (value.length > STUDIO_PATCH_LIMITS.maxArrayLength) throw new TypeError('La lista de una operación es demasiado larga.')
    for (const child of value) assertSafeValue(child, depth + 1, next)
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (blockedKey.test(key)) throw new TypeError(`La clave ${key} no está permitida.`)
    assertSafeValue(child, depth + 1, next)
  }
}

const assertSafeUrl = (path: string, value: unknown): void => {
  if (!path.endsWith('/mediaUrl') || typeof value !== 'string') return
  let url: URL
  try { url = new URL(value) } catch { throw new TypeError('La URL de medios no es válida.') }
  if (url.protocol !== 'https:' || url.username || url.password) throw new TypeError('La URL de medios debe usar HTTPS y no incluir credenciales.')
}

const assertFieldValue = (path: string, value: unknown): void => {
  if (/^\/page\/(title|summary)$/.test(path) || /^\/page\/blocks\/\d+\/(heading|body|mediaId)$/.test(path)) {
    if (typeof value !== 'string') throw new TypeError('El campo de texto debe recibir texto.')
  } else if (/^\/brand\/colors\//.test(path)) {
    if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) throw new TypeError('El color debe ser hexadecimal RGB de seis dígitos.')
  } else if (/^\/brand\/usageWeights\//.test(path)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new TypeError('El porcentaje debe estar entre 0 y 100.')
  } else if (/^\/brand\/motion\/(duration|stagger|travel)$/.test(path)) {
    const limits = path.endsWith('/duration') ? [150, 1600] : path.endsWith('/stagger') ? [0, 500] : [0, 80]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < limits[0] || value > limits[1]) throw new TypeError('El valor de movimiento está fuera de límites.')
  } else if (path.endsWith('/easing')) {
    if (typeof value !== 'string' || !['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(value)) throw new TypeError('La curva de movimiento no está permitida.')
  } else if (path.endsWith('/reducedMotion')) {
    if (value !== 'reduce' && value !== 'disable') throw new TypeError('El movimiento reducido no está permitido.')
  } else if (/\/crop\/(x|y|zoom)$/.test(path)) {
    const minimum = path.endsWith('/zoom') ? 0.1 : 0
    const maximum = path.endsWith('/zoom') ? 10 : 100
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) throw new TypeError('El valor de recorte está fuera de límites.')
  } else if (/\/layout\/(variant|alignment)$/.test(path) && typeof value !== 'string') {
    throw new TypeError('El valor de composición debe ser texto.')
  }
}

export const validateStudioPatch = (input: unknown, switches: AssistCapabilitySwitches): StudioPatch => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('El patch debe ser un objeto.')
  const patch = input as Record<string, unknown>
  if (Object.keys(patch).some((key) => !allowedPatchKeys.has(key))) throw new TypeError('El patch contiene una propiedad no permitida.')
  if (patch.schemaVersion !== 1) throw new TypeError('Versión de StudioPatch no soportada.')
  if (typeof patch.capability !== 'string' || !assistCapabilitySet.has(patch.capability)) throw new TypeError('Capacidad de asistencia desconocida.')
  const capability = patch.capability as AssistCapability
  if (switches[capability] !== true) throw new TypeError(`La capacidad ${capability} está desactivada.`)
  if (!Array.isArray(patch.operations) || patch.operations.length === 0 || patch.operations.length > STUDIO_PATCH_LIMITS.maxOperations)
    throw new TypeError('Cantidad de operaciones no permitida.')

  for (const raw of patch.operations) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('Cada operación debe ser un objeto.')
    const operation = raw as Record<string, unknown>
    if (Object.keys(operation).some((key) => !allowedOperationKeys.has(key))) throw new TypeError('La operación contiene una propiedad no permitida.')
    if (operation.op !== 'add' && operation.op !== 'remove' && operation.op !== 'replace') throw new TypeError('Operación no permitida.')
    if (typeof operation.path === 'string' && (operation.path.length > 256 || operation.path.includes('~')))
      throw new TypeError('La ruta contiene sintaxis JSON Pointer no permitida.')
    if (typeof operation.path !== 'string') throw new TypeError('La ruta no está permitida para esta capacidad.')
    const operationPath = operation.path
    if (!capabilityPaths[capability].some((pattern) => pattern.test(operationPath)))
      throw new TypeError('La ruta no está permitida para esta capacidad.')
    const blockIndex = /^\/page\/blocks\/(\d+)\//.exec(operationPath)?.[1]
    if (blockIndex !== undefined && Number(blockIndex) > 255) throw new TypeError('El índice de bloque excede el límite permitido.')
    if (operation.op !== 'remove' && !Object.hasOwn(operation, 'value')) throw new TypeError('La operación requiere un valor.')
    if (Object.hasOwn(operation, 'value')) {
      assertSafeValue(operation.value)
      assertSafeUrl(operationPath, operation.value)
      assertFieldValue(operationPath, operation.value)
    }
  }

  let serialized: string
  try { serialized = JSON.stringify(input) } catch { throw new TypeError('El patch debe ser JSON serializable.') }
  if (Buffer.byteLength(serialized, 'utf8') > STUDIO_PATCH_LIMITS.maxSerializedBytes) throw new TypeError('El patch excede el máximo de bytes permitido.')
  return deepFreeze(JSON.parse(serialized) as StudioPatch)
}

export const decideStudioPatch = (input: unknown, switches: AssistCapabilitySwitches): AssistDecision => {
  const capability = input && typeof input === 'object' && !Array.isArray(input) && typeof (input as { capability?: unknown }).capability === 'string'
    && assistCapabilitySet.has((input as { capability: string }).capability)
    ? (input as { capability: AssistCapability }).capability
    : undefined
  try {
    const patch = validateStudioPatch(input, switches)
    return { allowed: true, capability: patch.capability, patch }
  } catch (error) {
    return { allowed: false, ...(capability ? { capability } : {}), reason: error instanceof Error ? error.message : 'Patch rechazado.' }
  }
}
