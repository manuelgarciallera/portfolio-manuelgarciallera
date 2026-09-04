import { analyzePublicBoundary, formatBoundaryViolations } from './lib/public-boundary.mjs'

const result = await analyzePublicBoundary()
if (result.violations.length) {
  console.error('Public dependency boundary failed:')
  console.error(formatBoundaryViolations(result.violations).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Public dependency boundary passed (${result.entries.length} app entries).`)
}
