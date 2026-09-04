import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

import { analyzePublicBoundary } from './public-boundary.mjs'
import { assertFreshBuild, compareBundleSnapshot, createBundleSnapshot } from './public-bundle.mjs'

const RUNTIME_KEYS = ['dependencies', 'optionalDependencies', 'peerDependencies', 'overrides']
const CHECKPOINT_COMMIT = '0f0adf686b2752e23c25d224f8c60815b10fd451'
const CHECKPOINT_TAG = 'checkpoint/pre-editor-2026-09-04'
const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)])) : value
const stableJson = (value) => JSON.stringify(stable(value))
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

const readJson = async (path, label) => {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return parsed
  } catch (error) { throw new Error(`Cannot read ${label}: ${path}`, { cause: error }) }
}
const runtimeManifest = (manifest) => Object.fromEntries(RUNTIME_KEYS.map((key) => [key, manifest[key] ?? {}]))

export async function hashPublicInputs(rootDir, runtime = undefined) {
  const effectiveRuntime = runtime ?? runtimeManifest(await readJson(join(rootDir, 'package.json'), 'root package manifest'))
  const files = []
  const visit = async (directory) => {
    let entries = []
    try { entries = await readdir(directory, { withFileTypes: true }) } catch { return }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) await visit(full)
      else files.push(full)
    }
  }
  for (const directory of ['src', 'content', 'public']) await visit(join(rootDir, directory))
  for (const file of ['next.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'public-dependency-allowlist.json']) {
    try { if ((await stat(join(rootDir, file))).isFile()) files.push(join(rootDir, file)) } catch {}
  }
  const hash = createHash('sha256')
  hash.update(`runtime:${stableJson(effectiveRuntime)}\n`)
  for (const file of files.sort()) {
    hash.update(`${relative(rootDir, file).split(sep).join('/')}\0`)
    hash.update(await readFile(file)); hash.update('\0')
  }
  return hash.digest('hex')
}

async function assertSafeBuildPath(buildDir, artifactRoot) {
  const absoluteBuild = resolve(buildDir)
  const absoluteRoot = resolve(artifactRoot)
  const rel = relative(absoluteRoot, absoluteBuild)
  if (!rel || rel.startsWith('..') || rel.includes(sep) || !/^[a-z0-9][a-z0-9-]*$/.test(rel)) throw new Error('PUBLIC_BUILD_DIR must be one dedicated directory directly inside the verification artifact root')
  const workspace = resolve(artifactRoot, '..', '..', '..')
  const [realBuild, realRoot, realWorkspace] = await Promise.all([realpath(absoluteBuild), realpath(absoluteRoot), realpath(workspace)])
  if (relative(realWorkspace, realRoot).startsWith('..') || relative(realRoot, realBuild).startsWith('..')) throw new Error('verification artifacts must not escape the workspace through a link')
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const item = join(directory, entry.name)
      const resolved = await realpath(item)
      if (relative(realRoot, resolved).startsWith('..')) throw new Error('verification build contains a link that escapes the artifact root')
      if ((await stat(item)).isDirectory()) await visit(item)
    }
  }
  await visit(realBuild)
  return { absoluteBuild, artifactName: rel }
}

const git = (rootDir, args, encoding = 'utf8') => execFileSync('git', args, { cwd: rootDir, encoding })

export async function proveOwnerIsolation({ artifactRoot, buildDir, checkpointCommit = CHECKPOINT_COMMIT, checkpointTag = CHECKPOINT_TAG, gitHead, requireFreshBuild = true, rootDir = process.cwd() } = {}) {
  const absoluteRoot = resolve(rootDir)
  const safeRoot = resolve(artifactRoot ?? join(absoluteRoot, 'owner-platform', '.data', 'verification-artifacts'))
  if (!buildDir) throw new Error('PUBLIC_BUILD_DIR is required')
  const { absoluteBuild, artifactName } = await assertSafeBuildPath(buildDir, safeRoot)
  git(absoluteRoot, ['cat-file', '-e', `${checkpointCommit}^{commit}`])
  const resolvedTag = git(absoluteRoot, ['rev-parse', `refs/tags/${checkpointTag}^{commit}`]).trim()
  if (resolvedTag !== checkpointCommit) throw new Error('checkpoint tag does not resolve to the immutable checkpoint commit')
  const checkpointPackage = JSON.parse(git(absoluteRoot, ['show', `${checkpointCommit}:package.json`]))
  const checkpointLock = git(absoluteRoot, ['show', `${checkpointCommit}:package-lock.json`], null)
  const bundleBaseline = JSON.parse(await readFile(join(absoluteRoot, 'scripts', 'public-bundle-baseline.json'), 'utf8'))
  const rootPackage = await readJson(join(absoluteRoot, 'package.json'), 'root package manifest')
  const ownerPackage = await readJson(join(absoluteRoot, 'owner-platform', 'package.json'), 'owner package manifest')
  if (ownerPackage.private !== true) throw new Error('owner package must remain private')
  const currentRuntime = runtimeManifest(rootPackage)
  const rootRuntimeManifestMatchesCheckpoint = stableJson(currentRuntime) === stableJson(runtimeManifest(checkpointPackage))
  const lockContents = await readFile(join(absoluteRoot, 'package-lock.json'))
  const rootPackageLockMatchesCheckpoint = sha256(lockContents) === sha256(checkpointLock)
  const publicBoundary = await analyzePublicBoundary({ rootDir: absoluteRoot })
  if (requireFreshBuild) await assertFreshBuild({ rootDir: absoluteRoot, buildDir: absoluteBuild })
  const snapshot = await createBundleSnapshot({ buildDir: absoluteBuild })
  const regressions = compareBundleSnapshot(snapshot, bundleBaseline)
  const verifiedGitHead = gitHead ?? git(absoluteRoot, ['rev-parse', 'HEAD']).trim()
  const publicInputSha256 = await hashPublicInputs(absoluteRoot, currentRuntime)
  const markerPath = join(absoluteBuild, '.owner-public-build-provenance.json')
  const marker = await readJson(markerPath, 'public build provenance marker')
  const buildId = (await readFile(join(absoluteBuild, 'BUILD_ID'), 'utf8')).trim()
  const [markerStat, buildIdStat] = await Promise.all([stat(markerPath), stat(join(absoluteBuild, 'BUILD_ID'))])
  if (buildIdStat.mtimeMs > Date.now() + 5000 || markerStat.mtimeMs > Date.now() + 5000 || markerStat.mtimeMs < buildIdStat.mtimeMs) throw new Error('public build provenance timestamps are invalid or were touched')
  const provenanceMatches = marker.schemaVersion === 1 && marker.verifiedGitHead === verifiedGitHead && marker.publicInputSha256 === publicInputSha256 && marker.buildId === buildId
  const passed = rootRuntimeManifestMatchesCheckpoint && rootPackageLockMatchesCheckpoint && publicBoundary.violations.length === 0 && regressions.length === 0
  return {
    schemaVersion: 3, passed: passed && provenanceMatches, checkpoint: { commit: checkpointCommit, tag: checkpointTag }, verifiedGitHead,
    publicInputSha256, buildProvenanceMatches: provenanceMatches,
    rootRuntimeManifestSha256: sha256(stableJson(currentRuntime)), rootPackageLockSha256: sha256(lockContents),
    rootRuntimeManifestMatchesCheckpoint, rootPackageLockMatchesCheckpoint,
    ownerPackage: { name: ownerPackage.name, private: ownerPackage.private },
    publicBoundary: { entryCount: publicBoundary.entries.length, violations: publicBoundary.violations },
    publicBundle: { artifactName, routeCount: Object.keys(snapshot.routes).length, outputSha256: sha256(stableJson(snapshot.routes)), tolerance: snapshot.tolerance, regressions, routes: snapshot.routes },
  }
}
