import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assertFreshBuild, compareBundleSnapshot, createBundleSnapshot } from './lib/public-bundle.mjs'

// Regenera scripts/public-bundle-baseline.json a partir del build actual.
//
// Por que existe: cada ruta publica nueva rompia `check:public-bundle` y obligaba a
// escribir los bytes a mano. Un presupuesto que se edita a mano deja de ser evidencia.
// Aqui la unica fuente son los manifiestos del build, igual que en la comprobacion.
//
//   npm run build && npm run bundle:baseline            -> muestra el diff, no escribe
//   npm run build && npm run bundle:baseline -- --write -> escribe el baseline
//
// El baseline es un presupuesto, no un registro: solo se reescribe cuando la subida
// esta justificada y queda anotada en 00_Coordinacion_IA/docs/REGISTRO.md.

const shouldWrite = process.argv.includes('--write')
const baselinePath = join(process.cwd(), 'scripts', 'public-bundle-baseline.json')

let baseline = null
try {
  baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
} catch {
  console.warn('No hay baseline previo: se generara uno nuevo.')
}

await assertFreshBuild()
const current = await createBundleSnapshot()

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`
const routes = Object.keys(current.routes).sort()
const previous = baseline?.routes ?? {}

console.log(`Rutas publicas en el build: ${routes.length}`)
for (const route of routes) {
  const now = current.routes[route]
  const before = previous[route]
  if (!before) {
    console.log(`  + ${route.padEnd(28)} ${kb(now.rawBytes)} raw / ${kb(now.gzipBytes)} gzip  (ruta nueva)`)
    continue
  }
  const rawDelta = now.rawBytes - before.rawBytes
  const gzipDelta = now.gzipBytes - before.gzipBytes
  const sign = (value) => (value > 0 ? `+${value}` : `${value}`)
  const marker = rawDelta === 0 && gzipDelta === 0 ? ' ' : rawDelta > 0 ? '^' : 'v'
  console.log(`  ${marker} ${route.padEnd(28)} ${kb(now.rawBytes)} raw / ${kb(now.gzipBytes)} gzip  (${sign(rawDelta)} B raw, ${sign(gzipDelta)} B gzip)`)
}

for (const route of Object.keys(previous).sort()) {
  if (!(route in current.routes)) console.log(`  - ${route.padEnd(28)} desaparecida del build`)
}

if (baseline) {
  const errors = compareBundleSnapshot(current, baseline)
  if (errors.length) {
    console.log('\nDiferencias frente al baseline vigente:')
    console.log(errors.map((error) => `- ${error}`).join('\n'))
  } else {
    console.log('\nEl baseline vigente ya cubre este build: no hace falta reescribirlo.')
  }
}

if (!shouldWrite) {
  console.log('\nSimulacion. Anade -- --write para guardar el baseline.')
  process.exit(0)
}

await writeFile(baselinePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
console.log(`\nBaseline reescrito: ${baselinePath}`)
