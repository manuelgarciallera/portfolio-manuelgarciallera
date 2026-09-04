import { gzipSync } from 'node:zlib'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

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
  return relativePath ? `/${relativePath}` : '/'
}

function isPublicRoute(route) {
  const segments = route.split('/').filter(Boolean)
  return !segments.some((segment) => {
    const normalized = segment.replace(/^\(@?/, '').replace(/^@/, '').replace(/\)$/, '')
    return normalized === 'owner' || normalized === 'admin' || normalized.startsWith('_')
  })
}

function normalizeChunk(chunk) {
  const normalized = chunk.replace(/^\/?_next\//, '').replace(/^\//, '')
  return normalized.startsWith('static/') && normalized.endsWith('.js') ? normalized : null
}

function manifestChunks(manifest) {
  const chunks = new Set()
  for (const clientModule of Object.values(manifest.clientModules ?? {})) {
    for (const chunk of clientModule.chunks ?? []) {
      const normalized = normalizeChunk(chunk)
      if (normalized) chunks.add(normalized)
    }
  }
  for (const files of Object.values(manifest.entryJSFiles ?? {})) {
    for (const file of files ?? []) {
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
  const routes = {}
  for (const manifestPath of manifests) {
    const route = routeFromManifest(manifestPath, appDir)
    if (!isPublicRoute(route)) continue
    const manifest = parseManifest(await readFile(manifestPath, 'utf8'), manifestPath)
    const files = manifestChunks(manifest)
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
    tolerance: { percent: 0.01, bytes: 2048 },
    routes: Object.fromEntries(Object.entries(routes).sort(([a], [b]) => a.localeCompare(b))),
  }
}

export function compareBundleSnapshot(current, baseline) {
  if (baseline.schemaVersion !== 1) return [`unsupported baseline schema: ${baseline.schemaVersion}`]
  const errors = []
  const baselineRoutes = Object.keys(baseline.routes).sort()
  const currentRoutes = Object.keys(current.routes).sort()
  for (const route of baselineRoutes) {
    if (!(route in current.routes)) errors.push(`missing public route: ${route}`)
  }
  for (const route of currentRoutes) {
    if (!(route in baseline.routes)) errors.push(`public route has no baseline: ${route}`)
  }
  const percent = baseline.tolerance?.percent ?? 0.01
  const bytes = baseline.tolerance?.bytes ?? 2048
  for (const route of baselineRoutes.filter((item) => item in current.routes)) {
    for (const metric of ['rawBytes', 'gzipBytes']) {
      const label = metric === 'rawBytes' ? 'raw' : 'gzip'
      const increase = current.routes[route][metric] - baseline.routes[route][metric]
      const limit = Math.max(bytes, Math.ceil(baseline.routes[route][metric] * percent))
      if (increase > limit) errors.push(`${route} ${label} increased by ${increase} B (limit ${limit} B)`)
    }
  }
  return errors
}
