import { validateUsageWeights } from '../brand/validation'

export const ASSIST_CAPABILITIES = ['suggestCopy', 'suggestPalette', 'suggestLayout', 'suggestCrop', 'suggestMotion'] as const
export type AssistCapability = (typeof ASSIST_CAPABILITIES)[number]
export type AssistCapabilitySwitches = Readonly<Record<AssistCapability, boolean>>
export type StudioPatchOperation = Readonly<{ op: 'add' | 'remove' | 'replace'; path: string; value?: unknown }>
export type StudioPatch = Readonly<{ schemaVersion: 1; capability: AssistCapability; operations: readonly StudioPatchOperation[] }>
export type StudioPatchContext = Readonly<{
  page: Readonly<{ title: string; layout: readonly Readonly<Record<string, unknown>>[] }>
  brand: Readonly<{ colors: readonly Readonly<{ role: string; value: string }>[]; usageWeights: readonly Readonly<{ role: string; weight: number }>[]; motion: Readonly<Record<string, unknown>> }>
}>
export type AssistDecision = Readonly<{ allowed: true; capability: AssistCapability; patch: StudioPatch }> | Readonly<{ allowed: false; capability?: AssistCapability; reason: string }>
export const STUDIO_PATCH_LIMITS = Object.freeze({ maxOperations: 32, maxValueDepth: 8, maxStringLength: 4_000, maxSerializedBytes: 64 * 1024, maxArrayLength: 64 })

const capabilities = new Set<string>(ASSIST_CAPABILITIES)
const envelopeKeys = new Set(['schemaVersion', 'capability', 'operations'])
const operationKeys = new Set(['op', 'path', 'value'])
const blockedKey = /(?:^__proto__$|^prototype$|^constructor$|^script$|^javascript$|^html$|^css$|^on[a-z]+$|secret|token|password|authorization|credential|private[-_]?key|api[-_]?key|cookie|session)/i

function assertPlainDataRecord(value: unknown, label: string, required: readonly string[] = []): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} debe ser un objeto plano.`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} debe ser un objeto plano.`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const key of required) if (!Object.hasOwn(descriptors, key)) throw new TypeError(`${label} requiere propiedades propias.`)
  for (const descriptor of Object.values(descriptors)) if (!Object.hasOwn(descriptor, 'value')) throw new TypeError(`${label} solo admite datos planos, no getters.`)
}
const assertSafeValue = (value: unknown, depth = 0, ancestors = new Set<object>()): void => {
  if (depth > STUDIO_PATCH_LIMITS.maxValueDepth) throw new TypeError('Profundidad máxima excedida.')
  if (value === null || typeof value === 'boolean') return
  if (typeof value === 'string') { if (value.length > STUDIO_PATCH_LIMITS.maxStringLength) throw new TypeError('Texto demasiado largo.'); return }
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new TypeError('Número JSON no válido.'); return }
  if (!value || typeof value !== 'object') throw new TypeError('Solo se admiten valores JSON.')
  if (ancestors.has(value)) throw new TypeError('Referencia cíclica rechazada.')
  const next = new Set(ancestors).add(value)
  if (Array.isArray(value)) { assertDataArray(value, 'El valor de lista'); if (value.length > STUDIO_PATCH_LIMITS.maxArrayLength) throw new TypeError('Lista demasiado larga.'); for (const child of value) assertSafeValue(child, depth + 1, next); return }
  assertPlainDataRecord(value, 'El valor')
  for (const [key, child] of Object.entries(value)) { if (blockedKey.test(key)) throw new TypeError(`Clave ${key} no permitida.`); assertSafeValue(child, depth + 1, next) }
}
const deepFreeze = <T>(value: T): T => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }; return value }
const stableJSON = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJSON((value as Record<string, unknown>)[key])}`).join(',')}}`
}
function assertDataArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} debe ser una lista.`)
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label} no admite un prototipo personalizado.`)
  if (Object.getOwnPropertySymbols(value).length) throw new TypeError(`${label} no admite propiedades de símbolos.`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (key !== 'length' && !/^(0|[1-9]\d*)$/.test(key)) throw new TypeError(`${label} contiene una propiedad no permitida.`)
    if (key !== 'length' && !Object.hasOwn(descriptor, 'value')) throw new TypeError(`${label} solo admite datos planos, no getters.`)
  }
}

const assertContext = (context: StudioPatchContext): void => {
  assertPlainDataRecord(context, 'El contexto', ['page', 'brand'])
  assertPlainDataRecord(context.page, 'La página del contexto', ['title', 'layout'])
  assertPlainDataRecord(context.brand, 'La marca del contexto', ['colors', 'usageWeights', 'motion'])
  if (typeof context.page.title !== 'string') throw new TypeError('El contexto proyectado no es válido.')
  assertDataArray(context.page.layout, 'El layout del contexto')
  assertDataArray(context.brand.colors, 'Los colores del contexto')
  assertDataArray(context.brand.usageWeights, 'Los porcentajes del contexto')
  for (const block of context.page.layout) assertPlainDataRecord(block, 'El bloque del contexto')
  for (const color of context.brand.colors) assertPlainDataRecord(color, 'El color del contexto', ['role', 'value'])
  for (const weight of context.brand.usageWeights) assertPlainDataRecord(weight, 'El porcentaje del contexto', ['role', 'weight'])
  assertPlainDataRecord(context.brand.motion, 'El movimiento del contexto')
}

const classifyPath = (path: string, context: StudioPatchContext): { capability: AssistCapability; required: boolean; kind: string; index?: number } => {
  if (path === '/page/title') return { capability: 'suggestCopy', required: true, kind: 'text' }
  let match = /^\/page\/layout\/(0|[1-9]\d*)\/(heading|caption)$/.exec(path)
  if (match) {
    const index = Number(match[1]), field = match[2]
    if (index > 255) throw new TypeError('El índice excede el límite permitido.')
    const block = context.page.layout[index]
    if (!block || !Object.hasOwn(block, field)) throw new TypeError('El campo solicitado no existe en el bloque actual.')
    return { capability: 'suggestCopy', required: false, kind: 'text', index }
  }
  match = /^\/brand\/colors\/(0|[1-9]\d*)\/value$/.exec(path)
  if (match) { const index = Number(match[1]); if (index > 255 || !context.brand.colors[index]) throw new TypeError('El color solicitado no existe.'); return { capability: 'suggestPalette', required: true, kind: 'color', index } }
  match = /^\/brand\/usageWeights\/(0|[1-9]\d*)\/weight$/.exec(path)
  if (match) { const index = Number(match[1]); if (index > 255 || !context.brand.usageWeights[index]) throw new TypeError('El porcentaje solicitado no existe.'); return { capability: 'suggestPalette', required: true, kind: 'weight', index } }
  match = /^\/brand\/motion\/(duration|stagger|travel|easing|reducedMotion)$/.exec(path)
  if (match && Object.hasOwn(context.brand.motion, match[1])) return { capability: 'suggestMotion', required: false, kind: match[1] }
  throw new TypeError('La ruta no está permitida.')
}
const assertTypedValue = (kind: string, value: unknown): void => {
  if (kind === 'text' && typeof value !== 'string') throw new TypeError('El campo requiere texto.')
  if (kind === 'color' && (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value))) throw new TypeError('El color debe ser hexadecimal RGB de seis dígitos.')
  if (kind === 'weight' && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) throw new TypeError('El porcentaje debe estar entre 0 y 100.')
  const ranges: Record<string, [number, number]> = { duration: [150, 1600], stagger: [0, 500], travel: [0, 80] }
  if (ranges[kind] && (typeof value !== 'number' || !Number.isFinite(value) || value < ranges[kind][0] || value > ranges[kind][1])) throw new TypeError('El valor de movimiento está fuera de límites.')
  if (kind === 'easing' && (typeof value !== 'string' || !['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(value))) throw new TypeError('Curva no permitida.')
  if (kind === 'reducedMotion' && value !== 'reduce' && value !== 'disable') throw new TypeError('Movimiento reducido no permitido.')
}

export const validateStudioPatch = (input: unknown, switches: AssistCapabilitySwitches, context: StudioPatchContext): StudioPatch => {
  assertContext(context)
  assertPlainDataRecord(input, 'El patch', ['schemaVersion', 'capability', 'operations'])
  if (Object.keys(input).some((key) => !envelopeKeys.has(key))) throw new TypeError('El patch contiene una propiedad no permitida.')
  if (input.schemaVersion !== 1 || typeof input.capability !== 'string' || !capabilities.has(input.capability)) throw new TypeError('Versión o capacidad no permitida.')
  const capability = input.capability as AssistCapability
  if (!switches[capability]) throw new TypeError(`La capacidad ${capability} está desactivada.`)
  if (capability === 'suggestCrop') throw new TypeError(`La capacidad ${capability} no dispone aún de operaciones seguras.`)
  assertDataArray(input.operations, 'Las operaciones')
  if (input.operations.length < 1 || input.operations.length > STUDIO_PATCH_LIMITS.maxOperations) throw new TypeError('Cantidad de operaciones no permitida.')
  if (capability === 'suggestLayout') {
    if (input.operations.length !== 1) throw new TypeError('La reordenación debe ser una operación atómica.')
    const operation = input.operations[0]
    assertPlainDataRecord(operation, 'La operación', ['op', 'path', 'value'])
    if (Object.keys(operation).some((key) => !operationKeys.has(key)) || operation.op !== 'replace' || operation.path !== '/page/layout') throw new TypeError('La reordenación solo admite replace sobre el layout completo.')
    assertSafeValue(operation.value)
    assertDataArray(operation.value, 'El layout propuesto')
    const current = context.page.layout.map(stableJSON).sort()
    const proposed = operation.value.map(stableJSON).sort()
    if (current.length !== proposed.length || current.some((block, index) => block !== proposed[index])) throw new TypeError('La reordenación debe conservar exactamente los mismos bloques.')
  }
  const weightValues = new Map<number, number>()
  for (const raw of input.operations) {
    assertPlainDataRecord(raw, 'La operación', ['op', 'path'])
    if (Object.keys(raw).some((key) => !operationKeys.has(key))) throw new TypeError('La operación contiene una propiedad no permitida.')
    if (raw.op !== 'add' && raw.op !== 'remove' && raw.op !== 'replace') throw new TypeError('Operación no permitida.')
    if (typeof raw.path !== 'string' || raw.path.length > 256 || raw.path.includes('~')) throw new TypeError('Ruta no permitida.')
    if (capability === 'suggestLayout') continue
    const field = classifyPath(raw.path, context)
    if (field.capability !== capability) throw new TypeError('La ruta no corresponde a la capacidad declarada.')
    const hasValue = Object.hasOwn(raw, 'value')
    if (raw.op === 'remove') { if (hasValue) throw new TypeError('Remove no admite valor.'); if (field.required) throw new TypeError('No se puede eliminar un campo obligatorio.'); continue }
    if (!hasValue) throw new TypeError('La operación requiere valor.')
    assertSafeValue(raw.value); assertTypedValue(field.kind, raw.value)
    if (field.kind === 'weight') weightValues.set(field.index as number, raw.value as number)
  }
  if (weightValues.size) {
    if (weightValues.size !== context.brand.usageWeights.length || [...weightValues.keys()].some((index) => index >= context.brand.usageWeights.length)) throw new TypeError('La propuesta de porcentajes debe ser completa y atómica.')
    const proposed = context.brand.usageWeights.map((entry, index) => ({ role: entry.role, weight: weightValues.get(index) as number }))
    const errors = validateUsageWeights(proposed); if (errors.length) throw new TypeError(errors.join(' '))
  }
  const serialized = JSON.stringify(input)
  if (Buffer.byteLength(serialized, 'utf8') > STUDIO_PATCH_LIMITS.maxSerializedBytes) throw new TypeError('El patch excede el máximo de bytes.')
  return deepFreeze(JSON.parse(serialized) as StudioPatch)
}
export const decideStudioPatch = (input: unknown, switches: AssistCapabilitySwitches, context: StudioPatchContext): AssistDecision => {
  const capability = input && typeof input === 'object' && Object.hasOwn(input, 'capability') && typeof (input as { capability?: unknown }).capability === 'string' && capabilities.has((input as { capability: string }).capability) ? (input as { capability: AssistCapability }).capability : undefined
  try { const patch = validateStudioPatch(input, switches, context); return { allowed: true, capability: patch.capability, patch } }
  catch (error) { return { allowed: false, ...(capability ? { capability } : {}), reason: error instanceof Error ? error.message : 'Patch rechazado.' } }
}
