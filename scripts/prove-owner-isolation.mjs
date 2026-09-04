import { proveOwnerIsolation } from './lib/owner-isolation.mjs'

const evidence = await proveOwnerIsolation({
  buildDir: process.env.PUBLIC_BUILD_DIR,
})

console.log(JSON.stringify(evidence, null, 2))
if (!evidence.passed) process.exitCode = 1
