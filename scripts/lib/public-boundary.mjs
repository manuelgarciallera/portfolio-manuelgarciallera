import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs']
const STYLE_EXTENSIONS = ['.css']
const FORBIDDEN_PACKAGES = [
  'payload',
  '@payloadcms/',
  '@puckeditor/',
  '@measured/puck',
  'lexical',
  '@lexical/',
]
const PRIVATE_SEGMENTS = new Set(['owner', 'admin'])
// Un route handler nunca viaja al navegador: Next lo ejecuta solo en el servidor.
// Es la unica frontera que permite dependencias que no pueden entrar en el bundle publico.
const ROUTE_HANDLER = /(^|\/)route\.(?:ts|tsx|js|jsx|mts|mjs|cts|cjs)$/

function toPosix(value) {
  return value.split(sep).join('/')
}

function isPrivatePath(filePath, sourceRoot) {
  const parts = toPosix(relative(sourceRoot, filePath)).split('/')
  return parts.some((part) => PRIVATE_SEGMENTS.has(part))
}

function isForbiddenPackage(specifier) {
  return FORBIDDEN_PACKAGES.some((name) =>
    name.endsWith('/') ? specifier.startsWith(name) : specifier === name || specifier.startsWith(`${name}/`),
  )
}

function literalText(node) {
  if (!node) return null
  return ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : null
}

function extractScriptSpecifiers(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true)
  const found = new Set()
  function add(node) {
    const value = literalText(node)
    if (value !== null) found.add(value)
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier)
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression)
    if (ts.isCallExpression(node) && node.arguments.length >= 1) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) add(node.arguments[0])
      if (ts.isIdentifier(node.expression) && node.expression.text === 'require') add(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return [...found]
}

function extractStyleSpecifiers(source) {
  const found = new Set()
  for (const match of source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?/gi)) found.add(match[1])
  for (const match of source.matchAll(/url\(\s*["']?([^"')]+\.css(?:[?#][^"')]*)?)["']?\s*\)/gi)) found.add(match[1])
  return [...found]
}

async function existingSource(candidate) {
  const possibilities = extname(candidate)
    ? [candidate]
    : [
        ...[...SOURCE_EXTENSIONS, ...STYLE_EXTENSIONS].map((extension) => `${candidate}${extension}`),
        ...[...SOURCE_EXTENSIONS, ...STYLE_EXTENSIONS].map((extension) => join(candidate, `index${extension}`)),
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

// Conjunto de archivos alcanzables desde unas entradas siguiendo solo imports locales.
// Sirve para demostrar que un modulo NO cuelga de ninguna pagina, en vez de fiarse de su nombre.
async function reachableFrom(entries, aliases) {
  const reached = new Set()
  async function walk(file) {
    const canonical = normalize(file)
    if (reached.has(canonical)) return
    reached.add(canonical)
    let source
    try {
      source = await readFile(canonical, 'utf8')
    } catch {
      return
    }
    const specifiers = STYLE_EXTENSIONS.includes(extname(canonical))
      ? extractStyleSpecifiers(source)
      : extractScriptSpecifiers(source, canonical)
    for (const specifier of specifiers) {
      const resolved = await resolveLocalImport(specifier, canonical, aliases)
      if (resolved) await walk(resolved)
    }
  }
  for (const entry of entries) await walk(entry)
  return reached
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
  const allowlistPath = join(absoluteRoot, 'public-dependency-allowlist.json')
  let allowlist
  try {
    allowlist = JSON.parse(await readFile(allowlistPath, 'utf8'))
  } catch (error) {
    throw new Error(`cannot read public dependency allowlist: ${allowlistPath}`, { cause: error })
  }
  if (!Array.isArray(allowlist.packages) || !allowlist.packages.every((item) => typeof item === 'string')) {
    throw new Error('public dependency allowlist packages must be an array of strings')
  }
  const serverOnly = allowlist.serverOnlyPackages ?? []
  if (!Array.isArray(serverOnly) || !serverOnly.every((item) => typeof item === 'string')) {
    throw new Error('public dependency allowlist serverOnlyPackages must be an array of strings')
  }
  const allowedPackages = new Set(allowlist.packages)
  const serverOnlyPackages = new Set(serverOnly)
  const entries = (await walkFiles(appRoot)).filter((file) => !isPrivatePath(file, sourceRoot)).sort()
  // Todo lo que cuelga de una pagina o un layout puede acabar en el navegador. Lo que solo
  // cuelga de un route handler, no. La lista server-only se comprueba contra esta prueba,
  // no contra una etiqueta: si manana una pagina importa el modulo, el fallo reaparece.
  const clientReachable = await reachableFrom(entries.filter((file) => !ROUTE_HANDLER.test(toPosix(file))), aliases)
  const visited = new Set()
  const violations = []

  async function visit(file, trace) {
    const canonical = normalize(file)
    if (visited.has(canonical)) return
    visited.add(canonical)
    const source = await readFile(canonical, 'utf8')
    const specifiers = STYLE_EXTENSIONS.includes(extname(canonical))
      ? extractStyleSpecifiers(source)
      : extractScriptSpecifiers(source, canonical)
    for (const specifier of specifiers) {
      if (isForbiddenPackage(specifier)) {
        violations.push({ importer: toPosix(relative(absoluteRoot, canonical)), specifier, reason: 'explicitly forbidden public dependency', trace: trace.map((item) => toPosix(relative(absoluteRoot, item))) })
        continue
      }
      const resolved = await resolveLocalImport(specifier, canonical, aliases)
      if (resolved) {
        const nextTrace = [...trace, resolved]
        if (isPrivatePath(resolved, sourceRoot)) {
          violations.push({ importer: toPosix(relative(absoluteRoot, canonical)), specifier, reason: 'private owner/admin module', trace: nextTrace.map((item) => toPosix(relative(absoluteRoot, item))) })
          continue
        }
        await visit(resolved, nextTrace)
        continue
      }
      if (/^(?:https?:|data:|node:)/.test(specifier)) continue
      const packageName = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]
      if (allowedPackages.has(packageName)) continue
      if (serverOnlyPackages.has(packageName)) {
        if (!clientReachable.has(canonical)) continue
        violations.push({ importer: toPosix(relative(absoluteRoot, canonical)), specifier, reason: 'server-only dependency reached from a public page', trace: trace.map((item) => toPosix(relative(absoluteRoot, item))) })
        continue
      }
      violations.push({ importer: toPosix(relative(absoluteRoot, canonical)), specifier, reason: 'public dependency is not allowlisted', trace: trace.map((item) => toPosix(relative(absoluteRoot, item))) })
    }
  }

  for (const entry of entries) await visit(entry, [entry])
  violations.sort((a, b) => a.importer.localeCompare(b.importer) || a.specifier.localeCompare(b.specifier))
  return { entries: entries.map((file) => toPosix(relative(absoluteRoot, file))), violations }
}

export function formatBoundaryViolations(violations) {
  return violations.map((violation) => `${violation.importer}: ${violation.reason}: "${violation.specifier}"\n  ${violation.trace.join(' -> ')}`)
}
