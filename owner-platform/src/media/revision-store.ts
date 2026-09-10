import { randomUUID } from 'node:crypto'
import { lstat, mkdir, open, readdir, realpath } from 'node:fs/promises'
import { isAbsolute, join, parse, resolve } from 'node:path'

import { MANIFEST_NAME, MAX_MANIFEST_BYTES, digest, snapshotFiles, validateRevision, validateManifest, type Manifest } from './revision-manifest'

const samePath = (left: string, right: string): boolean =>
  process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right

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
