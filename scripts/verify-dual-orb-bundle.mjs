import {readFile} from 'node:fs/promises'
import {createBundleSnapshot,compareBundleSnapshot} from './lib/public-bundle.mjs'
const before=await createBundleSnapshot({buildDir:'.owner-verification-builds/h1-cadence-20260917'})
const after=await createBundleSnapshot({buildDir:'.owner-verification-builds/orb-lab-final-20260917'})
const baseline=JSON.parse(await readFile('scripts/public-bundle-baseline.json','utf8'))
const errors=compareBundleSnapshot(after,baseline)
console.log(JSON.stringify({homeBefore:before.routes['/'],homeAfter:after.routes['/'],lab:after.routes['/lab/orbes'],errors},null,2))
if(errors.length||after.routes['/'].rawBytes>before.routes['/'].rawBytes+2048)process.exitCode=1
