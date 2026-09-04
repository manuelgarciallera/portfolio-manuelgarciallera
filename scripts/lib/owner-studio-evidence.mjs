import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

const ISOLATION_RECORD = 'docs/owner-platform/isolation-evidence-2026-09-04.json'
export const OWNER_SURFACE_EXCLUSIONS = [
  'owner-platform/src/payload-types.ts',
  'owner-platform/next-env.d.ts',
  'owner-platform/.data/',
  'owner-platform/.next/',
  'owner-platform/node_modules/',
  'owner-platform/media/',
  'owner-platform/uploads/',
  'owner-platform/.env',
  'owner-platform/.env.local',
  'owner-platform/.env.development.local',
  'owner-platform/.env.production.local',
  'owner-platform/.env.test.local',
]

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

export const assertEvidenceOnlyChanges = (changed, isolationEvidencePath) => {
  const allowed = new Set([
    isolationEvidencePath,
    'docs/owner-platform/owner-studio-phase-2-evidence.json',
  ])
  if (changed.some((file) => !allowed.has(file)))
    throw new Error('Commits after verifiedGitHead contain changes other than the approved evidence records')
}

const excluded = (path) => OWNER_SURFACE_EXCLUSIONS.some((entry) => entry.endsWith('/') ? path.startsWith(entry) : path === entry)

const collectFiles = (rootDir) => execFileSync('git', ['ls-files', '--', 'owner-platform'], { cwd: rootDir, encoding: 'utf8' })
  .trim().split(/\r?\n/).filter(Boolean).filter((path) => !excluded(path)).sort().map((path) => join(rootDir, path))

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
  const ownerFiles = collectFiles(absoluteRoot)
  if (ownerFiles.length === 0) throw new Error('No tracked owner platform files were found')

  return {
    schemaVersion: 2,
    verifiedGitHead: isolation.verifiedGitHead,
    isolationEvidencePath: ISOLATION_RECORD,
    isolationEvidenceSha256: sha256(isolationBytes),
    ownerTrackedFileCount: ownerFiles.length,
    ownerTrackedSurfaceSha256: await hashFiles(absoluteRoot, ownerFiles),
    ownerTrackedSurfaceExclusions: OWNER_SURFACE_EXCLUSIONS,
    ownerPackageLockSha256: sha256(await readFile(join(absoluteRoot, 'owner-platform', 'package-lock.json'))),
    publicIsolationRecord: {
      passed: true,
      routeCount: isolation.publicBundle.routeCount,
      publicBoundaryViolations: 0,
      publicBundleRegressions: 0,
    },
  }
}

export async function verifyOwnerStudioEvidence(saved, options = {}) {
  const current = await createOwnerStudioEvidence(options)
  if (JSON.stringify(saved) !== JSON.stringify(current))
    throw new Error('Committed owner studio evidence does not match current verified inputs')
  return current
}
