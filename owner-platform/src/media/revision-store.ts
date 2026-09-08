import { createHash, randomUUID } from 'node:crypto'
import { lstat, mkdir, open, readdir, realpath } from 'node:fs/promises'
import { isAbsolute, join, parse, resolve } from 'node:path'

const MANIFEST_NAME = 'manifest.json'
const MAX_MANIFEST_BYTES = 64 * 1024
const MAX_FILES = 16
const MAX_TOTAL_BYTES = 64 * 1024 * 1024
const MAX_NAME_BYTES = 255
const WINDOWS_DEVICE_NAME = /^(?:aux|con|nul|prn|com[1-9]|lpt[1-9])(?:\.|$)/i
const REVISION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
const SHA256 = /^[0-9a-f]{64}$/u

type Manifest = {
  schema: 1
  revision: string
  files: { name: string; size: number; sha256: string }[]
}

const digest = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex')

const samePath = (left: string, right: string): boolean =>
  process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasExactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const keys = Object.keys(value)
  return keys.length === expected.length && keys.every((key) => expected.includes(key))
}

const validateRealDirectory = async (path: string, label: string): Promise<string> => {
  const stats = await lstat(path)
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error(`${label} debe ser un directorio real.`)
  }
  const physical = await realpath(path)
  if (!samePath(physical, resolve(path))) {
    throw new Error(`${label} no puede atravesar enlaces.`)
  }
  return physical
}

const validateRoot = async (root: string): Promise<string> => {
  if (typeof root !== 'string' || !isAbsolute(root)) {
    throw new Error('La raíz de revisiones debe ser una ruta absoluta.')
  }
  const resolved = resolve(root)
  if (samePath(resolved, parse(resolved).root)) {
    throw new Error('La raíz de revisiones no puede ser la raíz del sistema de archivos.')
  }
  return validateRealDirectory(resolved, 'La raíz de revisiones')
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

const snapshotFiles = (files: { name: string; bytes: Buffer }[]): { name: string; bytes: Buffer }[] => {
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

const validateRevision = (revision: unknown): string => {
  if (typeof revision !== 'string' || !REVISION_ID.test(revision)) {
    throw new Error('El identificador de revisión no es válido.')
  }
  return revision
}

const validateManifest = (value: unknown, revision: string): Manifest => {
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

const readBoundedRegularFile = async (path: string, maxBytes: number): Promise<Buffer> => {
  const before = await lstat(path)
  if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) {
    throw new Error('La revisión contiene un archivo enlazado o no regular.')
  }
  const physical = await realpath(path)
  if (!samePath(physical, resolve(path))) {
    throw new Error('La ruta de un archivo de revisión atraviesa un enlace.')
  }

  const handle = await open(path, 'r')
  try {
    const opened = await handle.stat()
    if (
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.size !== before.size ||
      opened.size > maxBytes
    ) {
      throw new Error('El archivo de revisión cambió o supera el límite permitido.')
    }
    const bytes = Buffer.alloc(opened.size)
    let offset = 0
    while (offset < bytes.length) {
      const result = await handle.read(bytes, offset, bytes.length - offset, offset)
      if (result.bytesRead === 0) break
      offset += result.bytesRead
    }
    const after = await handle.stat()
    if (offset !== bytes.length || after.size !== opened.size) {
      throw new Error('El archivo de revisión cambió durante la lectura.')
    }
    return bytes
  } finally {
    await handle.close()
  }
}

const assertExactDirectoryEntries = async (revisionPath: string, manifest: Manifest): Promise<void> => {
  const expected = new Set([MANIFEST_NAME, ...manifest.files.map(({ name }) => name)])
  const entries = await readdir(revisionPath, { withFileTypes: true })
  if (
    entries.length !== expected.size ||
    entries.some((entry) => !expected.has(entry.name) || !entry.isFile())
  ) {
    throw new Error('El directorio de revisión contiene entradas ausentes, extra o no regulares.')
  }
}

const writeExclusive = async (path: string, bytes: Buffer): Promise<void> => {
  const handle = await open(path, 'wx', 0o600)
  try {
    await handle.writeFile(bytes)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

export const writeMediaRevision = async (
  root: string,
  files: { name: string; bytes: Buffer }[],
): Promise<string> => {
  const snapshot = snapshotFiles(files)
  const physicalRoot = await validateRoot(root)
  const revision = randomUUID()
  const revisionPath = join(physicalRoot, revision)
  await mkdir(revisionPath, { mode: 0o700 })
  await validateRealDirectory(revisionPath, 'El directorio de revisión')
  const manifest: Manifest = {
    schema: 1,
    revision,
    files: snapshot.map(({ name, bytes }) => ({ name, size: bytes.length, sha256: digest(bytes) })),
  }
  for (const file of snapshot) await writeExclusive(join(revisionPath, file.name), file.bytes)
  await writeExclusive(join(revisionPath, MANIFEST_NAME), Buffer.from(JSON.stringify(manifest)))
  return revision
}

export const readMediaRevision = async (
  root: string,
  revision: string,
): Promise<{ name: string; bytes: Buffer }[]> => {
  validateRevision(revision)
  const physicalRoot = await validateRoot(root)
  const revisionPath = join(physicalRoot, revision)
  await validateRealDirectory(revisionPath, 'El directorio de revisión')
  const manifestBytes = await readBoundedRegularFile(
    join(revisionPath, MANIFEST_NAME),
    MAX_MANIFEST_BYTES,
  )
  let parsed: unknown
  try {
    parsed = JSON.parse(manifestBytes.toString('utf8'))
  } catch {
    throw new Error('El manifiesto de revisión no contiene JSON válido.')
  }
  const manifest = validateManifest(parsed, revision)
  await assertExactDirectoryEntries(revisionPath, manifest)

  const result: { name: string; bytes: Buffer }[] = []
  for (const entry of manifest.files) {
    const bytes = await readBoundedRegularFile(join(revisionPath, entry.name), entry.size)
    if (bytes.length !== entry.size || digest(bytes) !== entry.sha256) {
      throw new Error('Un archivo de revisión no coincide con su manifiesto.')
    }
    result.push({ name: entry.name, bytes })
  }
  await assertExactDirectoryEntries(revisionPath, manifest)
  return result
}
