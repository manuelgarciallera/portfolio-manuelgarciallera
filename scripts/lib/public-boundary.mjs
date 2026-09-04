import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs']
const FORBIDDEN_PACKAGES = [
  'payload',
  '@payloadcms/',
  '@puckeditor/',
  '@measured/puck',
  'lexical',
  '@lexical/',
]
const PRIVATE_SEGMENTS = new Set(['owner', 'admin'])

function toPosix(value) {
  return value.split(sep).join('/')
}

function isPrivatePath(filePath, sourceRoot) {
  const parts = toPosix(relative(sourceRoot, filePath)).split('/')
  return parts.some((part) => PRIVATE_SEGMENTS.has(part.replace(/^\(@?/, '').replace(/^@/, '').replace(/\)$/, '')))
}

function isForbiddenPackage(specifier) {
  return FORBIDDEN_PACKAGES.some((name) =>
    name.endsWith('/') ? specifier.startsWith(name) : specifier === name || specifier.startsWith(`${name}/`),
  )
}

function extractSpecifiers(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s*)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ]
  const found = []
  for (const pattern of patterns) {
    for (const match of withoutComments.matchAll(pattern)) found.push(match[1])
  }
  return [...new Set(found)]
}

async function existingSource(candidate) {
  const possibilities = extname(candidate)
    ? [candidate]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${candidate}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => join(candidate, `index${extension}`)),
      ]
  for (const possibility of possibilities) {
    try {
      if ((await stat(possibility)).isFile()) return possibility
    } catch {}
  }
  return null
}

function compileAliases(tsconfig, rootDir) {
  const paths = tsconfig.compilerOptions?.paths ?? {}
  return Object.entries(paths).flatMap(([pattern, targets]) =>
    targets.map((target) => {
      const wildcard = pattern.indexOf('*')
      const prefix = wildcard === -1 ? pattern : pattern.slice(0, wildcard)
      const suffix = wildcard === -1 ? '' : pattern.slice(wildcard + 1)
      return { pattern, prefix, suffix, target, rootDir }
    }),
  )
}

async function resolveLocalImport(specifier, importer, aliases) {
  if (specifier.startsWith('.')) return existingSource(resolve(dirname(importer), specifier))
  if (isAbsolute(specifier)) return existingSource(specifier)
  for (const alias of aliases) {
    if (!specifier.startsWith(alias.prefix) || !specifier.endsWith(alias.suffix)) continue
    const middle = specifier.slice(alias.prefix.length, specifier.length - alias.suffix.length || undefined)
    const target = alias.target.replace('*', middle)
    const resolved = await existingSource(resolve(alias.rootDir, target))
    if (resolved) return resolved
  }
  return null
}

async function walkFiles(directory) {
  const files = []
  let entries = []
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walkFiles(fullPath)))
    else if (SOURCE_EXTENSIONS.includes(extname(entry.name))) files.push(fullPath)
  }
  return files
}

export async function analyzePublicBoundary({ rootDir = process.cwd() } = {}) {
  const absoluteRoot = resolve(rootDir)
  const sourceRoot = join(absoluteRoot, 'src')
  const appRoot = join(sourceRoot, 'app')
  let tsconfig = {}
  try {
    tsconfig = JSON.parse(await readFile(join(absoluteRoot, 'tsconfig.json'), 'utf8'))
  } catch {}
  const aliases = compileAliases(tsconfig, absoluteRoot)
  const entries = (await walkFiles(appRoot)).filter((file) => !isPrivatePath(file, sourceRoot)).sort()
  const visited = new Set()
  const violations = []

  async function visit(file, trace) {
    const canonical = normalize(file)
    if (visited.has(canonical)) return
    visited.add(canonical)
    const source = await readFile(canonical, 'utf8')
    for (const specifier of extractSpecifiers(source)) {
      if (isForbiddenPackage(specifier)) {
        violations.push({ importer: toPosix(relative(absoluteRoot, canonical)), specifier, trace: trace.map((item) => toPosix(relative(absoluteRoot, item))) })
        continue
      }
      const resolved = await resolveLocalImport(specifier, canonical, aliases)
      if (!resolved) continue
      const nextTrace = [...trace, resolved]
      if (isPrivatePath(resolved, sourceRoot)) {
        violations.push({ importer: toPosix(relative(absoluteRoot, canonical)), specifier, trace: nextTrace.map((item) => toPosix(relative(absoluteRoot, item))) })
        continue
      }
      await visit(resolved, nextTrace)
    }
  }

  for (const entry of entries) await visit(entry, [entry])
  violations.sort((a, b) => a.importer.localeCompare(b.importer) || a.specifier.localeCompare(b.specifier))
  return { entries: entries.map((file) => toPosix(relative(absoluteRoot, file))), violations }
}

export function formatBoundaryViolations(violations) {
  return violations.map((violation) => `${violation.importer}: forbidden import "${violation.specifier}"\n  ${violation.trace.join(' -> ')}`)
}
