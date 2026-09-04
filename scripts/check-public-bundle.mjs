import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assertFreshBuild, compareBundleSnapshot, createBundleSnapshot } from './lib/public-bundle.mjs'

const baselinePath = join(process.cwd(), 'scripts', 'public-bundle-baseline.json')
let baseline
try {
  baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
} catch (error) {
  console.error(`Cannot read public bundle baseline: ${baselinePath}`)
  throw error
}
await assertFreshBuild()
const current = await createBundleSnapshot()
const errors = compareBundleSnapshot(current, baseline)
if (errors.length) {
  console.error('Public bundle budget failed:')
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Public bundle budget passed (${Object.keys(current.routes).length} routes; tolerance 1% or 2 KB, whichever is larger).`)
}
