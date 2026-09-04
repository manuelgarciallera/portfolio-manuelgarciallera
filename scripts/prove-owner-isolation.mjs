import { proveOwnerIsolation } from './lib/owner-isolation.mjs'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { assertEvidenceOnlyChanges } from './lib/owner-studio-evidence.mjs'

const option = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1)
const writeTarget = option('--write')
const verifyTarget = option('--verify')
if (writeTarget && verifyTarget) throw new Error('Choose either --write or --verify')
const assertEvidenceTarget = (target) => {
  const absolute = resolve(target)
  const allowedRoot = resolve(process.cwd(), 'docs', 'owner-platform')
  const rel = relative(allowedRoot, absolute)
  if (!rel || rel.startsWith('..') || rel.includes(sep) || !/^isolation-evidence-[0-9]{4}-[0-9]{2}-[0-9]{2}[.]json$/.test(rel)) throw new Error('Evidence target must be a dated JSON file directly inside docs/owner-platform')
  return absolute
}
let saved
let verifiedGitHead
if (verifyTarget) {
  const absoluteTarget = assertEvidenceTarget(verifyTarget)
  saved = await readFile(absoluteTarget, 'utf8')
  const parsed = JSON.parse(saved)
  verifiedGitHead = parsed.verifiedGitHead
  if (typeof verifiedGitHead !== 'string' || !/^[a-f0-9]{40}$/.test(verifiedGitHead)) throw new Error('Committed evidence has an invalid verifiedGitHead')
  execFileSync('git', ['merge-base', '--is-ancestor', verifiedGitHead, 'HEAD'], { stdio: 'ignore' })
  const changed = execFileSync('git', ['diff', '--name-only', `${verifiedGitHead}..HEAD`], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean)
  const expected = relative(process.cwd(), absoluteTarget).split(sep).join('/')
  assertEvidenceOnlyChanges(changed, expected)
}
const evidence = await proveOwnerIsolation({ buildDir: process.env.PUBLIC_BUILD_DIR, gitHead: verifiedGitHead })
const rendered = `${JSON.stringify(evidence, null, 2)}\n`
if (writeTarget) await writeFile(assertEvidenceTarget(writeTarget), rendered, { flag: 'w' })
else if (verifyTarget) {
  if (saved !== rendered) throw new Error('Committed isolation evidence does not match the current verified inputs and build')
} else console.log(rendered.trimEnd())
if (!evidence.passed) process.exitCode = 1
