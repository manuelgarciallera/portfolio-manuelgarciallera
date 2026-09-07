import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const MANIFEST_NAME = 'manifest.json'
const DATA_DIRECTORY = 'data'

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const isInside = (parent, child) => {
  const relative = path.relative(path.resolve(parent), path.resolve(child))
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)
}

const assertSeparate = (left, right) => {
  if (path.resolve(left) === path.resolve(right) || isInside(left, right) || isInside(right, left)) {
    throw new Error('Recovery directories must be distinct and non-nested.')
  }
}

const assertAbsent = async (directory, label) => {
  try {
    await stat(directory)
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
  throw new Error(`${label} already exists.`)
}

export const snapshotFiles = async (rootDirectory) => {
  const records = []
  const visit = async (directory, prefix = '') => {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))
    for (const entry of entries) {
      if (entry.isSymbolicLink()) throw new Error('Recovery inputs cannot contain symbolic links.')
      const absolute = path.join(directory, entry.name)
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) await visit(absolute, relative)
      else if (entry.isFile()) {
        const bytes = await readFile(absolute)
        records.push({ path: relative, sha256: digest(bytes), size: bytes.length })
      } else throw new Error('Recovery inputs can contain only regular files and directories.')
    }
  }
  await visit(rootDirectory)
  return records
}

const validManifest = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (value.schemaVersion !== 1 || !/^[0-9a-f]{40}$/.test(value.applicationCommit)) return false
  if (!Array.isArray(value.files) || value.files.length === 0) return false
  const paths = new Set()
  for (const file of value.files) {
    if (!file || typeof file !== 'object' || Array.isArray(file)) return false
    if (!Number.isSafeInteger(file.size) || file.size < 0 || !/^[0-9a-f]{64}$/.test(file.sha256)) return false
    if (typeof file.path !== 'string' || file.path.includes('\\') || file.path.startsWith('/') || file.path.split('/').some((part) => !part || part === '.' || part === '..')) return false
    if (!file.path.startsWith('database/') && !file.path.startsWith('media/')) return false
    if (paths.has(file.path)) return false
    paths.add(file.path)
  }
  return value.files.some((file) => file.path.startsWith('database/')) && value.files.some((file) => file.path.startsWith('media/'))
}

export const verifyPhysicalBackup = async (backupDirectory) => {
  let manifest
  try {
    manifest = JSON.parse(await readFile(path.join(backupDirectory, MANIFEST_NAME), 'utf8'))
    if (!validManifest(manifest)) throw new Error('Invalid manifest')
    const actual = await snapshotFiles(path.join(backupDirectory, DATA_DIRECTORY))
    if (JSON.stringify(actual) !== JSON.stringify(manifest.files)) throw new Error('File mismatch')
  } catch (error) {
    throw new Error('Backup integrity check failed.', { cause: error })
  }
  return manifest
}

export const createPhysicalBackup = async ({ applicationCommit, backupDirectory, sourceDirectory }) => {
  if (!/^[0-9a-f]{40}$/.test(applicationCommit)) throw new Error('Application commit must be a full Git SHA.')
  assertSeparate(sourceDirectory, backupDirectory)
  await assertAbsent(backupDirectory, 'Backup directory')
  const sourceFiles = await snapshotFiles(sourceDirectory)
  const manifest = { schemaVersion: 1, applicationCommit, files: sourceFiles }
  if (!validManifest(manifest)) throw new Error('Backup source must contain database and media files.')
  await mkdir(backupDirectory)
  await cp(sourceDirectory, path.join(backupDirectory, DATA_DIRECTORY), { recursive: true, errorOnExist: true, force: false })
  const copiedFiles = await snapshotFiles(path.join(backupDirectory, DATA_DIRECTORY))
  if (JSON.stringify(copiedFiles) !== JSON.stringify(sourceFiles)) throw new Error('Backup copy verification failed.')
  await writeFile(path.join(backupDirectory, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  return manifest
}

export const restoreVerifiedBackup = async ({ backupDirectory, restoreDirectory }) => {
  assertSeparate(backupDirectory, restoreDirectory)
  await assertAbsent(restoreDirectory, 'Restore directory')
  const manifest = await verifyPhysicalBackup(backupDirectory)
  await mkdir(restoreDirectory)
  await cp(path.join(backupDirectory, DATA_DIRECTORY), restoreDirectory, { recursive: true, errorOnExist: true, force: false })
  const restored = await snapshotFiles(restoreDirectory)
  if (JSON.stringify(restored) !== JSON.stringify(manifest.files)) throw new Error('Restored files do not match the verified backup.')
  return manifest
}
