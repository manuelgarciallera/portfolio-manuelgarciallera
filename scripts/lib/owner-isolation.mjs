import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { analyzePublicBoundary } from './public-boundary.mjs'
import { assertFreshBuild, compareBundleSnapshot, createBundleSnapshot } from './public-bundle.mjs'

const OWNER_RUNTIME_PACKAGES = [
  /^payload$/,
  /^@payloadcms\//,
  /^lexical$/,
  /^@lexical\//,
  /^@measured\/puck$/,
]

const readJson = async (path, label) => {
  let parsed
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${path}`, { cause: error })
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object: ${path}`)
  }
  return parsed
}

const ownerDependenciesIn = (packageJson) =>
  Object.keys(packageJson.dependencies ?? {})
    .filter((name) => OWNER_RUNTIME_PACKAGES.some((pattern) => pattern.test(name)))
    .sort()

export async function proveOwnerIsolation({
  baselinePath,
  buildDir,
  requireFreshBuild = true,
  rootDir = process.cwd(),
} = {}) {
  const absoluteRoot = resolve(rootDir)
  const resolvedBaseline = resolve(baselinePath ?? join(absoluteRoot, 'scripts', 'public-bundle-baseline.json'))
  const resolvedBuild = resolve(buildDir ?? join(absoluteRoot, '.next'))
  const rootPackage = await readJson(join(absoluteRoot, 'package.json'), 'root package manifest')
  const ownerPackage = await readJson(join(absoluteRoot, 'owner-platform', 'package.json'), 'owner package manifest')
  if (ownerPackage.private !== true) throw new Error('owner package must remain private')

  const publicBoundary = await analyzePublicBoundary({ rootDir: absoluteRoot })
  const baseline = await readJson(resolvedBaseline, 'public bundle baseline')
  if (requireFreshBuild) {
    await assertFreshBuild({ rootDir: absoluteRoot, buildDir: resolvedBuild })
  }
  const snapshot = await createBundleSnapshot({ buildDir: resolvedBuild })
  const regressions = compareBundleSnapshot(snapshot, baseline)
  const rootRuntimeOwnerDependencies = ownerDependenciesIn(rootPackage)
  const passed =
    publicBoundary.violations.length === 0 &&
    rootRuntimeOwnerDependencies.length === 0 &&
    regressions.length === 0

  return {
    schemaVersion: 1,
    passed,
    ownerPackage: {
      name: ownerPackage.name,
      private: ownerPackage.private,
    },
    rootRuntimeOwnerDependencies,
    publicBoundary: {
      entryCount: publicBoundary.entries.length,
      violations: publicBoundary.violations,
    },
    publicBundle: {
      routeCount: Object.keys(snapshot.routes).length,
      tolerance: snapshot.tolerance,
      regressions,
      routes: snapshot.routes,
    },
  }
}
