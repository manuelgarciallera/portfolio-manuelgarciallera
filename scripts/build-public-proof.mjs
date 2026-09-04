import { execFileSync, spawnSync } from 'node:child_process'
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { hashPublicInputs } from './lib/owner-isolation.mjs'

const rootDir = process.cwd()
const artifactName = 'release-proof'
const temporaryBuild = resolve(rootDir, '.owner-verification-builds', artifactName)
const artifactRoot = resolve(rootDir, 'owner-platform', '.data', 'verification-artifacts')
const finalBuild = resolve(artifactRoot, artifactName)
if (!temporaryBuild.startsWith(resolve(rootDir, '.owner-verification-builds')) || !finalBuild.startsWith(artifactRoot)) throw new Error('Unsafe proof build path')

const verifiedGitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim()
const publicInputSha256 = await hashPublicInputs(rootDir)
await rm(temporaryBuild, { force: true, recursive: true })
await rm(finalBuild, { force: true, recursive: true })
const nextBin = resolve(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next')
const result = spawnSync(process.execPath, [nextBin, 'build'], {
  cwd: rootDir,
  env: { ...process.env, PORTFOLIO_BUILD_DIR: '.owner-verification-builds/release-proof' },
  stdio: 'inherit',
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
if (await hashPublicInputs(rootDir) !== publicInputSha256) throw new Error('Public inputs changed during the proof build')
const buildId = (await readFile(join(temporaryBuild, 'BUILD_ID'), 'utf8')).trim()
await writeFile(join(temporaryBuild, '.owner-public-build-provenance.json'), `${JSON.stringify({ schemaVersion: 1, verifiedGitHead, publicInputSha256, buildId }, null, 2)}\n`)
await rename(temporaryBuild, finalBuild)
console.log(`Public proof build recorded as ${artifactName} for ${verifiedGitHead}.`)
