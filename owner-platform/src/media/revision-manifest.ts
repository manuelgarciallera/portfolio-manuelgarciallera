import { createHash } from 'node:crypto'

export const MANIFEST_NAME = 'manifest.json'
export const MAX_MANIFEST_BYTES = 64 * 1024
const MAX_FILES = 16
const MAX_TOTAL_BYTES = 64 * 1024 * 1024
const MAX_NAME_BYTES = 255
const WINDOWS_DEVICE_NAME = /^(?:aux|con|nul|prn|com[1-9]|lpt[1-9])(?:\.|$)/i
const REVISION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
const SHA256 = /^[0-9a-f]{64}$/u

export type Manifest = {
  schema: 1
  revision: string
  files: { name: string; size: number; sha256: string }[]
}

export const digest = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasExactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const keys = Object.keys(value)
  return keys.length === expected.length && keys.every((key) => expected.includes(key))
}

const isWellFormedUtf16 = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index)
    if (unit >= 0xD800 && unit <= 0xDBFF) {
      if (index + 1 >= value.length) return false
      const next = value.charCodeAt(index + 1)
      if (next < 0xDC00 || next > 0xDFFF) return false
      index += 1
    } else if (unit >= 0xDC00 && unit <= 0xDFFF) {
      return false
    }
  }
  return true
}

const validateFileName = (name: unknown): string => {
  if (
    typeof name !== 'string' ||
    !isWellFormedUtf16(name) ||
    name.length === 0 ||
    Buffer.byteLength(name, 'utf8') > MAX_NAME_BYTES ||
    name === '.' ||
    name === '..' ||
    /[\\/:<>"|?*\u0000-\u001f\u007f]/u.test(name) ||
    /[. ]$/u.test(name) ||
    WINDOWS_DEVICE_NAME.test(name) ||
    name.toLowerCase() === MANIFEST_NAME
  ) {
    throw new Error('El nombre del archivo de revisión no es seguro.')
  }
  return name
}

export const snapshotFiles = (files: { name: string; bytes: Buffer }[]): { name: string; bytes: Buffer }[] => {
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES) {
    throw new Error(`Una revisión debe contener entre 1 y ${MAX_FILES} archivos.`)
  }
  const names = new Set<string>()
  let total = 0
  return files.map((file) => {
    const name = validateFileName(file?.name)
    const canonicalName = name.normalize('NFC').toLowerCase()
    if (names.has(canonicalName)) throw new Error('Los nombres de archivo deben ser únicos.')
    names.add(canonicalName)
    if (!Buffer.isBuffer(file?.bytes) || file.bytes.length === 0) {
      throw new Error('Cada archivo de revisión debe contener un Buffer no vacío.')
    }
    total += file.bytes.length
    if (total > MAX_TOTAL_BYTES) {
      throw new Error('La revisión supera el máximo total de 64 MiB.')
    }
    return { name, bytes: Buffer.from(file.bytes) }
  })
}

export const validateRevision = (revision: unknown): string => {
  if (typeof revision !== 'string' || !REVISION_ID.test(revision)) {
    throw new Error('El identificador de revisión no es válido.')
  }
  return revision
}

export const validateManifest = (value: unknown, revision: string): Manifest => {
  if (!isRecord(value) || !hasExactKeys(value, ['schema', 'revision', 'files'])) {
    throw new Error('El manifiesto de revisión no tiene el esquema esperado.')
  }
  if (value.schema !== 1 || value.revision !== revision || !Array.isArray(value.files)) {
    throw new Error('El manifiesto de revisión no es válido.')
  }
  if (value.files.length === 0 || value.files.length > MAX_FILES) {
    throw new Error('El manifiesto declara una cantidad de archivos no permitida.')
  }

  const names = new Set<string>()
  let total = 0
  const files = value.files.map((entry) => {
    if (!isRecord(entry) || !hasExactKeys(entry, ['name', 'size', 'sha256'])) {
      throw new Error('Una entrada del manifiesto no tiene el esquema esperado.')
    }
    const name = validateFileName(entry.name)
    const canonicalName = name.normalize('NFC').toLowerCase()
    if (names.has(canonicalName)) throw new Error('El manifiesto declara nombres duplicados.')
    names.add(canonicalName)
    if (!Number.isSafeInteger(entry.size) || (entry.size as number) <= 0) {
      throw new Error('El manifiesto declara un tamaño de archivo no válido.')
    }
    total += entry.size as number
    if (total > MAX_TOTAL_BYTES) {
      throw new Error('El manifiesto supera el máximo total de 64 MiB.')
    }
    if (typeof entry.sha256 !== 'string' || !SHA256.test(entry.sha256)) {
      throw new Error('El manifiesto declara un resumen SHA-256 no válido.')
    }
    return { name, size: entry.size as number, sha256: entry.sha256 }
  })

  return { schema: 1, revision, files }
}
