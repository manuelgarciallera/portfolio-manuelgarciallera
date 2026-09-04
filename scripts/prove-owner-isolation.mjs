import { proveOwnerIsolation } from './lib/owner-isolation.mjs'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

const option = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1)
const writeTarget = option('--write')
const verifyTarget = option('--verify')
if (writeTarget && verifyTarget) throw new Error('Choose either --write or --verify')

const evidence = await proveOwnerIsolation({
  buildDir: process.env.PUBLIC_BUILD_DIR,
})

const rendered = `${JSON.stringify(evidence, null, 2)}\n`
const assertEvidenceTarget = (target) => {
  const absolute = resolve(target)
  const allowedRoot = resolve(process.cwd(), 'docs', 'owner-platform')
  const rel = relative(allowedRoot, absolute)
  if (!rel || rel.startsWith('..') || rel.includes(sep) || !/^isolation-evidence-[0-9]{4}-[0-9]{2}-[0-9]{2}[.]json$/.test(rel)) throw new Error('Evidence target must be a dated JSON file directly inside docs/owner-platform')
  return absolute
}
if (writeTarget) await writeFile(assertEvidenceTarget(writeTarget), rendered, { flag: 'w' })
else if (verifyTarget) {
  const saved = await readFile(assertEvidenceTarget(verifyTarget), 'utf8')
  if (saved !== rendered) throw new Error('Committed isolation evidence does not match the current verified inputs and build')
} else console.log(rendered.trimEnd())
if (!evidence.passed) process.exitCode = 1
