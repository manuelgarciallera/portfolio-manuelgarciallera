import { gzipSync } from 'node:zlib'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'

const FIXED_TOLERANCE_PERCENT = 0.01
const FIXED_TOLERANCE_BYTES = 2048

function toPosix(value) {
  return value.split(sep).join('/')
}

async function findManifests(directory) {
  const manifests = []
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    throw new Error(`client reference manifest directory is missing: ${directory}`, { cause: error })
  }
  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) manifests.push(...(await findManifests(fullPath)))
    else if (entry.name === 'page_client-reference-manifest.js') manifests.push(fullPath)
  }
  return manifests
}

function parseManifest(source, manifestPath) {
  const assignment = source.match(/__RSC_MANIFEST\[["'][^"']+["']\]\s*=\s*/)
  if (!assignment) throw new Error(`cannot parse client reference manifest: ${manifestPath}`)
  const jsonStart = assignment.index + assignment[0].length
  const jsonEnd = source.lastIndexOf(';')
  try {
    return JSON.parse(source.slice(jsonStart, jsonEnd === -1 ? undefined : jsonEnd))
  } catch (error) {
    throw new Error(`invalid client reference manifest JSON: ${manifestPath}`, { cause: error })
  }
}

function routeFromManifest(manifestPath, appDir) {
  const manifestRelativePath = toPosix(relative(appDir, manifestPath))
  const relativePath = manifestRelativePath === 'page_client-reference-manifest.js'
    ? ''
    : manifestRelativePath.replace(/\/page_client-reference-manifest\.js$/, '')
  const visibleSegments = relativePath.split('/').filter((segment) => segment && !(segment.startsWith('(') && segment.endsWith(')')))
  return visibleSegments.length ? `/${visibleSegments.join('/')}` : '/'
}

function isPublicRoute(route) {
  const segments = route.split('/').filter(Boolean)
  return !segments.some((segment) => segment === 'owner' || segment === 'admin' || segment.startsWith('_'))
}

function normalizeChunk(chunk) {
  const normalized = chunk.replace(/^\/?_next\//, '').replace(/^\//, '')
  return normalized.startsWith('static/') && normalized.endsWith('.js') ? normalized : null
}

function manifestChunks(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('client reference manifest must be an object')
  if (!manifest.clientModules || typeof manifest.clientModules !== 'object' || Array.isArray(manifest.clientModules)) throw new Error('clientModules must be an object')
  if (!manifest.entryJSFiles || typeof manifest.entryJSFiles !== 'object' || Array.isArray(manifest.entryJSFiles)) throw new Error('entryJSFiles must be an object')
  const chunks = new Set()
  for (const clientModule of Object.values(manifest.clientModules ?? {})) {
    if (!clientModule || typeof clientModule !== 'object' || !Array.isArray(clientModule.chunks)) throw new Error('clientModules chunks must be an array')
    if (!clientModule.chunks.every((chunk) => typeof chunk === 'string')) throw new Error('clientModules chunks must contain only strings')
    for (const chunk of clientModule.chunks) {
      const normalized = normalizeChunk(chunk)
      if (normalized) chunks.add(normalized)
    }
  }
  for (const files of Object.values(manifest.entryJSFiles ?? {})) {
    if (!Array.isArray(files)) throw new Error('entryJSFiles chunks must be an array')
    if (!files.every((file) => typeof file === 'string')) throw new Error('entryJSFiles chunks must contain only strings')
    for (const file of files) {
      const normalized = normalizeChunk(file)
      if (normalized) chunks.add(normalized)
    }
  }
  return [...chunks].sort()
}

export async function createBundleSnapshot({ buildDir = join(process.cwd(), '.next') } = {}) {
  const absoluteBuild = resolve(buildDir)
  const appDir = join(absoluteBuild, 'server', 'app')
  const manifests = (await findManifests(appDir)).sort()
  const routeFiles = new Map()
  for (const manifestPath of manifests) {
    const route = routeFromManifest(manifestPath, appDir)
    if (!isPublicRoute(route)) continue
    const manifest = parseManifest(await readFile(manifestPath, 'utf8'), manifestPath)
    const files = manifestChunks(manifest)
    const accumulated = routeFiles.get(route) ?? new Set()
    for (const file of files) accumulated.add(file)
    routeFiles.set(route, accumulated)
  }
  const routes = {}
  for (const [route, fileSet] of routeFiles) {
    const files = [...fileSet].sort()
    let rawBytes = 0
    let gzipBytes = 0
    for (const file of files) {
      let contents
      try {
        contents = await readFile(join(absoluteBuild, file))
      } catch (error) {
        throw new Error(`missing client chunk for ${route}: ${file}`, { cause: error })
      }
      rawBytes += contents.byteLength
      gzipBytes += gzipSync(contents).byteLength
    }
    routes[route] = { rawBytes, gzipBytes, files }
  }
  return {
    schemaVersion: 1,
    tolerance: { percent: FIXED_TOLERANCE_PERCENT, bytes: FIXED_TOLERANCE_BYTES },
    routes: Object.fromEntries(Object.entries(routes).sort(([a], [b]) => a.localeCompare(b))),
  }
}

function validateSnapshot(snapshot, label) {
  const errors = []
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return [`${label} must be an object`]
  if (snapshot.schemaVersion !== 1) errors.push(`${label} schemaVersion must be 1`)
  if (!snapshot.tolerance || typeof snapshot.tolerance !== 'object' || Array.isArray(snapshot.tolerance)) {
    errors.push(`${label} tolerance must be an object`)
  } else {
    if (!Number.isFinite(snapshot.tolerance.percent) || snapshot.tolerance.percent < 0) errors.push(`${label} tolerance.percent must be a finite nonnegative number`)
    else if (snapshot.tolerance.percent !== FIXED_TOLERANCE_PERCENT) errors.push(`${label} tolerance.percent must equal the fixed policy value ${FIXED_TOLERANCE_PERCENT}`)
    if (!Number.isFinite(snapshot.tolerance.bytes) || snapshot.tolerance.bytes < 0) errors.push(`${label} tolerance.bytes must be a finite nonnegative number`)
    else if (snapshot.tolerance.bytes !== FIXED_TOLERANCE_BYTES) errors.push(`${label} tolerance.bytes must equal the fixed policy value ${FIXED_TOLERANCE_BYTES}`)
  }
  if (!snapshot.routes || typeof snapshot.routes !== 'object' || Array.isArray(snapshot.routes)) {
    errors.push(`${label} routes must be an object`)
    return errors
  }
  for (const [route, metrics] of Object.entries(snapshot.routes)) {
    if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
      errors.push(`${label} route ${route} must be an object`)
      continue
    }
    for (const metric of ['rawBytes', 'gzipBytes']) {
      if (!Number.isFinite(metrics[metric]) || metrics[metric] < 0) errors.push(`${label} route ${route} ${metric} must be a finite nonnegative number`)
    }
    if (!Array.isArray(metrics.files) || !metrics.files.every((file) => typeof file === 'string')) errors.push(`${label} route ${route} files must be an array of strings`)
  }
  return errors
}

export function compareBundleSnapshot(current, baseline) {
  const validationErrors = [...validateSnapshot(current, 'current'), ...validateSnapshot(baseline, 'baseline')]
  if (validationErrors.length) return validationErrors
  const errors = []
  const baselineRoutes = Object.keys(baseline.routes).sort()
  const currentRoutes = Object.keys(current.routes).sort()
  for (const route of baselineRoutes) {
    if (!(route in current.routes)) errors.push(`missing public route: ${route}`)
  }
  for (const route of currentRoutes) {
    if (!(route in baseline.routes)) errors.push(`public route has no baseline: ${route}`)
  }
  for (const route of baselineRoutes.filter((item) => item in current.routes)) {
    for (const metric of ['rawBytes', 'gzipBytes']) {
      const label = metric === 'rawBytes' ? 'raw' : 'gzip'
      const increase = current.routes[route][metric] - baseline.routes[route][metric]
      const limit = Math.max(FIXED_TOLERANCE_BYTES, Math.ceil(baseline.routes[route][metric] * FIXED_TOLERANCE_PERCENT))
      if (increase > limit) errors.push(`${route} ${label} increased by ${increase} B (limit ${limit} B)`)
    }
  }
  return errors
}

async function newestMtime(directory, filter) {
  let newest = 0
  let entries = []
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return newest
  }
  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) newest = Math.max(newest, await newestMtime(fullPath, filter))
    else if (filter(fullPath)) newest = Math.max(newest, (await stat(fullPath)).mtimeMs)
  }
  return newest
}

export async function assertFreshBuild({ rootDir = process.cwd(), buildDir = join(rootDir, '.next') } = {}) {
  const absoluteRoot = resolve(rootDir)
  const stampPath = join(resolve(buildDir), 'BUILD_ID')
  let buildTime
  try {
    buildTime = (await stat(stampPath)).mtimeMs
  } catch (error) {
    throw new Error(`production build provenance is missing: ${stampPath}`, { cause: error })
  }
  const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.json'])
  const relevantTimes = [
    await newestMtime(join(absoluteRoot, 'src'), (file) => sourceExtensions.has(extname(file))),
    await newestMtime(join(absoluteRoot, 'content'), () => true),
    await newestMtime(join(absoluteRoot, 'public'), () => true),
  ]
  for (const file of ['package.json', 'package-lock.json', 'next.config.ts', 'postcss.config.mjs', 'tsconfig.json', '.env', '.env.local', '.env.production']) {
    try { relevantTimes.push((await stat(join(absoluteRoot, file))).mtimeMs) } catch {}
  }
  if (Math.max(...relevantTimes) > buildTime) throw new Error('production build is stale: public source or configuration is newer than .next/BUILD_ID')
}
