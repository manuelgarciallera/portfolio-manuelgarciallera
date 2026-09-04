import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

const ISOLATION_RECORD = 'docs/owner-platform/isolation-evidence-2026-09-04.json'
const SOURCE_ROOTS = ['owner-platform/src']
const SOURCE_FILES = [
  'owner-platform/package.json',
  'owner-platform/next.config.mjs',
  'owner-platform/tsconfig.json',
]

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

const collectFiles = async (rootDir) => {
  const files = SOURCE_FILES.map((path) => join(rootDir, path))
  const visit = async (directory) => {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) files.push(path)
    }
  }
  for (const sourceRoot of SOURCE_ROOTS) await visit(join(rootDir, sourceRoot))
  return files.sort((a, b) => a.localeCompare(b))
}

const hashFiles = async (rootDir, files) => {
  const hash = createHash('sha256')
  for (const file of files) {
    hash.update(relative(rootDir, file).split(sep).join('/'))
    hash.update('\0')
    hash.update(await readFile(file))
    hash.update('\0')
  }
  return hash.digest('hex')
}

export async function createOwnerStudioEvidence({ rootDir = process.cwd() } = {}) {
  const absoluteRoot = resolve(rootDir)
  const isolationBytes = await readFile(join(absoluteRoot, ISOLATION_RECORD))
  const isolation = JSON.parse(isolationBytes.toString('utf8'))
  if (isolation?.passed !== true || typeof isolation.verifiedGitHead !== 'string' || !/^[a-f0-9]{40}$/.test(isolation.verifiedGitHead))
    throw new Error('Owner isolation evidence is not a passing record bound to a Git commit')
  if (isolation.publicBoundary?.violations?.length !== 0 || isolation.publicBundle?.regressions?.length !== 0)
    throw new Error('Owner isolation evidence contains public boundary or bundle regressions')

  return {
    schemaVersion: 1,
    passed: true,
    verifiedGitHead: isolation.verifiedGitHead,
    isolationEvidencePath: ISOLATION_RECORD,
    isolationEvidenceSha256: sha256(isolationBytes),
    ownerStudioSourceSha256: await hashFiles(absoluteRoot, await collectFiles(absoluteRoot)),
    ownerPackageLockSha256: sha256(await readFile(join(absoluteRoot, 'owner-platform', 'package-lock.json'))),
    publicProof: {
      routeCount: isolation.publicBundle.routeCount,
      publicBoundaryViolations: 0,
      publicBundleRegressions: 0,
    },
  }
}
