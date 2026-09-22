import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { chromium } from 'playwright'

if (process.argv.includes('--self-test')) {
  const audits = Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'cumulative-layout-shift'].map(id => [id, { numericValue: 1 }]))
  const valid = { audits, runWarnings: [] }
  assert.deepEqual(invalidReasons(valid, { exitCode: 0 }), [])
  assert.ok(invalidReasons(valid, { exitCode: 1 }).some(reason => reason.includes('CLI exit')))
  assert.ok(invalidReasons(valid, { exitCode: 0, timedOut: true }).includes('CLI timeout'))
  assert.ok(invalidReasons(null, { exitCode: 0 }).includes('No readable JSON report'))
  assert.ok(invalidReasons({ ...valid, runtimeError: { code: 'NO_FCP' } }, { exitCode: 0 }).some(reason => reason.startsWith('runtimeError')))
  for (const warning of ['pageLoadedTooSlowly', 'The page loaded too slowly and timed out.']) {
    assert.ok(invalidReasons({ ...valid, runWarnings: [warning] }, { exitCode: 0 }).includes('Load-warning invalidates comparison'))
  }
  assert.ok(invalidReasons({ ...valid, runWarnings: ['Other warning'] }, { exitCode: 0 }).includes('Run warnings invalidate comparison'))
  assert.ok(invalidReasons({ ...valid, audits: {} }, { exitCode: 0 }).some(reason => reason.startsWith('Missing metric')))
  console.log('Lighthouse validity policy: 9 checks passed; no browser launched.')
  process.exit(0)
}

// Connect Lighthouse to our own Chromium. ChromeLauncher never owns its profile.
// Requires an already-cached official lighthouse@13.4.0 CLI; no project install.
const option = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const cli = option('lighthouse-cli', process.env.LIGHTHOUSE_CLI)
assert.ok(cli, 'Pass --lighthouse-cli=/path/to/lighthouse/cli/index.js (official version 13.4.0)')
const packageInfo = JSON.parse(await readFile(path.resolve(path.dirname(cli), '..', 'package.json'), 'utf8'))
assert.equal(packageInfo.name, 'lighthouse')
assert.equal(packageInfo.version, '13.4.0')
const targets = { baseline: option('baseline', 'http://127.0.0.1:3101'), candidate: option('candidate', 'http://127.0.0.1:3102') }
for (const url of Object.values(targets)) assert.ok(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Local servers only')
const modes = option('modes', 'mobile').split(',')
assert.ok(modes.every(mode => ['desktop', 'mobile'].includes(mode)))
const routes = option('routes', '/').split(',')
assert.ok(routes.every(route => /^\/[a-z0-9/-]*$/i.test(route)))
const samples = Number(option('samples', '1'))
assert.ok(Number.isInteger(samples) && samples >= 1 && samples <= 5)
const timeoutMs = Number(option('timeout-ms', '120000'))
assert.ok(Number.isFinite(timeoutMs) && timeoutMs >= 30000 && timeoutMs <= 300000)
const output = path.resolve('.audit', `lighthouse-comparison-${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}`)
await mkdir(output, { recursive: true })
const results = []

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

async function execute(args, filename) {
  const started = Date.now()
  const child = spawn(process.execPath, [path.resolve(cli), ...args], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = '', stderr = '', timedOut = false
  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })
  const timer = setTimeout(() => { timedOut = true; child.kill() }, timeoutMs)
  const outcome = await new Promise(resolve => {
    child.once('error', error => resolve({ exitCode: null, processError: error.message }))
    child.once('close', (exitCode, signal) => resolve({ exitCode, signal }))
  })
  clearTimeout(timer)
  await Promise.all([
    writeFile(`${filename}.stdout.log`, stdout),
    writeFile(`${filename}.stderr.log`, stderr),
  ])
  return { ...outcome, timedOut, elapsedMs: Date.now() - started }
}

function invalidReasons(report, processResult) {
  const reasons = []
  if (processResult.exitCode !== 0) reasons.push(`CLI exit ${processResult.exitCode}`)
  if (processResult.timedOut) reasons.push('CLI timeout')
  if (!report) return [...reasons, 'No readable JSON report']
  if (report.runtimeError) reasons.push(`runtimeError: ${JSON.stringify(report.runtimeError)}`)
  const warnings = report.runWarnings ?? []
  if (warnings.length) reasons.push('Run warnings invalidate comparison')
  if (/pageLoadedTooSlowly|page loaded too slowly|page took too long|page did not load/i.test(JSON.stringify(warnings))) reasons.push('Load-warning invalidates comparison')
  for (const audit of ['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'cumulative-layout-shift']) {
    if (!Number.isFinite(report.audits?.[audit]?.numericValue)) reasons.push(`Missing metric: ${audit}`)
  }
  return reasons
}

async function sample(target, route, mode, index) {
  const url = new URL(route, targets[target]).href
  const stem = path.join(output, `${mode}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-${index}-${target}`)
  const port = await freePort()
  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1', '--window-size=1440,900', '--force-dark-mode'],
  })
  const browserVersion = browser.version()
  let report = null, processResult = { exitCode: null, elapsedMs: 0 }
  const started = new Date().toISOString()
  try {
    const connection = await fetch(`http://127.0.0.1:${port}/json/version`)
    assert.ok(connection.ok, 'Our Chromium remote-debugging port is ready')
    const args = [url, `--port=${port}`, '--hostname=127.0.0.1', '--no-enable-error-reporting',
      '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${stem}.report.json`]
    if (mode === 'desktop') args.push('--preset=desktop', '--screenEmulation.width=1440', '--screenEmulation.height=900')
    else args.push('--form-factor=mobile', '--screenEmulation.mobile=true', '--screenEmulation.width=390', '--screenEmulation.height=844', '--screenEmulation.deviceScaleFactor=2.625')
    processResult = await execute(args, stem)
    try { report = JSON.parse(await readFile(`${stem}.report.json`, 'utf8')) } catch { /* Recorded as INVALID, never converted into a score. */ }
  } catch (error) {
    processResult.processError = error.message
  } finally { await browser.close() }
  const reasons = invalidReasons(report, processResult)
  if (processResult.processError) reasons.push(processResult.processError)
  const result = { target, route, mode, index, url, started, browserVersion, ...processResult,
    status: reasons.length ? 'INVALID' : 'VALID', reasons, report: `${stem}.report.json`,
    runWarnings: report?.runWarnings ?? [], runtimeError: report?.runtimeError ?? null,
    settings: report?.configSettings ?? null,
    metrics: report ? Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'cumulative-layout-shift']
      .map(id => [id, report.audits?.[id]?.numericValue ?? null])) : null,
    scores: report ? Object.fromEntries(Object.entries(report.categories ?? {}).map(([id, category]) => [id, category.score])) : null,
  }
  results.push(result)
  await writeFile(path.join(output, 'runs.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(result))
}

// Alternate order per pair; keep a fresh profile, default dark theme and no consent.
for (const route of routes) for (const mode of modes) for (let index = 1; index <= samples; index++) {
  for (const target of index % 2 ? ['baseline', 'candidate'] : ['candidate', 'baseline']) await sample(target, route, mode, index)
}
const median = values => {
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const comparisons = []
for (const route of routes) for (const mode of modes) {
  const group = results.filter(result => result.route === route && result.mode === mode)
  const sameEnvironment = group.every(result => result.browserVersion === group[0].browserVersion && JSON.stringify(result.settings) === JSON.stringify(group[0].settings))
  const valid = group.length === samples * 2 && group.every(result => result.status === 'VALID') && sameEnvironment
  const baseline = group.filter(result => result.target === 'baseline')
  const candidate = group.filter(result => result.target === 'candidate')
  comparisons.push({ route, mode, status: valid ? 'COMPARABLE' : 'INVALID', sampleCountPerTarget: samples,
    sameEnvironment,
    note: samples < 3 ? 'Single/dual sample: directional snapshot, not a stable performance verdict.' : 'Median of paired, alternating-order runs; local lab evidence, not field data.',
    metrics: valid ? Object.fromEntries(Object.keys(baseline[0].metrics).map(id => {
      const before = median(baseline.map(result => result.metrics[id]))
      const after = median(candidate.map(result => result.metrics[id]))
      return [id, { baseline: before, candidate: after, delta: after - before }]
    })) : null,
  })
}
const summary = { output, policy: 'Fresh Chromium per run; same version, viewport/profile, default dark theme; JavaScript and 3D unmodified; no consent or forms; invalid runs never treated as passing.', comparisons }
await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
if (comparisons.some(comparison => comparison.status === 'INVALID')) process.exitCode = 1
