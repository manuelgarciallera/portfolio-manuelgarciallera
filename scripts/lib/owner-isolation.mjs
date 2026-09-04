import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

import { analyzePublicBoundary } from './public-boundary.mjs'
import { assertFreshBuild, compareBundleSnapshot, createBundleSnapshot } from './public-bundle.mjs'

const RUNTIME_KEYS = ['dependencies', 'optionalDependencies', 'peerDependencies', 'overrides']
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

async function hashPublicInputs(rootDir, runtime) {
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
  hash.update(`runtime:${stableJson(runtime)}\n`)
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
  const [realBuild, realRoot] = await Promise.all([realpath(absoluteBuild), realpath(absoluteRoot)])
  if (relative(realRoot, realBuild).startsWith('..')) throw new Error('PUBLIC_BUILD_DIR must not escape through a link')
  return { absoluteBuild, artifactName: rel }
}

export async function proveOwnerIsolation({ artifactRoot, baselinePath, buildDir, checkpointBaseline, gitHead, requireFreshBuild = true, rootDir = process.cwd() } = {}) {
  const absoluteRoot = resolve(rootDir)
  const safeRoot = resolve(artifactRoot ?? join(absoluteRoot, 'owner-platform', '.data', 'verification-artifacts'))
  if (!buildDir) throw new Error('PUBLIC_BUILD_DIR is required')
  const { absoluteBuild, artifactName } = await assertSafeBuildPath(buildDir, safeRoot)
  const checkpoint = checkpointBaseline ?? await readJson(join(absoluteRoot, 'scripts', 'owner-isolation-baseline.json'), 'owner isolation baseline')
  const bundleBaseline = await readJson(baselinePath ?? join(absoluteRoot, 'scripts', 'public-bundle-baseline.json'), 'public bundle baseline')
  const rootPackage = await readJson(join(absoluteRoot, 'package.json'), 'root package manifest')
  const ownerPackage = await readJson(join(absoluteRoot, 'owner-platform', 'package.json'), 'owner package manifest')
  if (ownerPackage.private !== true) throw new Error('owner package must remain private')
  const currentRuntime = runtimeManifest(rootPackage)
  const rootRuntimeManifestMatchesCheckpoint = stableJson(currentRuntime) === stableJson(checkpoint.rootRuntimeManifest)
  const lockContents = await readFile(join(absoluteRoot, 'package-lock.json'))
  const rootPackageLockMatchesCheckpoint = sha256(lockContents) === checkpoint.rootPackageLockSha256
  const publicBoundary = await analyzePublicBoundary({ rootDir: absoluteRoot })
  if (requireFreshBuild) await assertFreshBuild({ rootDir: absoluteRoot, buildDir: absoluteBuild })
  const snapshot = await createBundleSnapshot({ buildDir: absoluteBuild })
  const regressions = compareBundleSnapshot(snapshot, bundleBaseline)
  const verifiedGitHead = gitHead ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: absoluteRoot, encoding: 'utf8' }).trim()
  const passed = rootRuntimeManifestMatchesCheckpoint && rootPackageLockMatchesCheckpoint && publicBoundary.violations.length === 0 && regressions.length === 0
  return {
    schemaVersion: 2, passed, checkpoint: checkpoint.checkpoint, verifiedGitHead,
    publicInputSha256: await hashPublicInputs(absoluteRoot, currentRuntime),
    rootRuntimeManifestSha256: sha256(stableJson(currentRuntime)), rootPackageLockSha256: sha256(lockContents),
    rootRuntimeManifestMatchesCheckpoint, rootPackageLockMatchesCheckpoint,
    ownerPackage: { name: ownerPackage.name, private: ownerPackage.private },
    publicBoundary: { entryCount: publicBoundary.entries.length, violations: publicBoundary.violations },
    publicBundle: { artifactName, routeCount: Object.keys(snapshot.routes).length, outputSha256: sha256(stableJson(snapshot.routes)), tolerance: snapshot.tolerance, regressions, routes: snapshot.routes },
  }
}
