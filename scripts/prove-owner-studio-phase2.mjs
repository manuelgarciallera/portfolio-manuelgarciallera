import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { createOwnerStudioEvidence, verifyOwnerStudioEvidence } from './lib/owner-studio-evidence.mjs'

const option = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1)
const writeTarget = option('--write')
const verifyTarget = option('--verify')
if (writeTarget && verifyTarget) throw new Error('Choose either --write or --verify')

const assertTarget = (target) => {
  const absolute = resolve(target)
  const allowedRoot = resolve(process.cwd(), 'docs', 'owner-platform')
  const rel = relative(allowedRoot, absolute)
  if (!rel || rel.startsWith('..') || rel.includes(sep) || rel !== 'owner-studio-phase-2-evidence.json')
    throw new Error('Evidence target must be docs/owner-platform/owner-studio-phase-2-evidence.json')
  return absolute
}

const evidence = await createOwnerStudioEvidence()
const rendered = `${JSON.stringify(evidence, null, 2)}\n`
if (writeTarget) await writeFile(assertTarget(writeTarget), rendered, { flag: 'w' })
else if (verifyTarget) {
  const saved = await readFile(assertTarget(verifyTarget), 'utf8')
  await verifyOwnerStudioEvidence(JSON.parse(saved))
  if (saved !== rendered) throw new Error('Committed owner studio evidence does not use canonical formatting')
} else console.log(rendered.trimEnd())
