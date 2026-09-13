import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildEnvironment } from '../scripts/build-environment.mjs'

test('converts only the isolated system CA flag, preserving parent and other trust settings', () => {
  const original = Object.freeze({ NODE_OPTIONS: ' --use-system-ca ', NODE_EXTRA_CA_CERTS: 'custom.pem', PATH: 'original', NODE_TLS_REJECT_UNAUTHORIZED: '1' })
  const result = buildEnvironment(original, 'win32', '24.13.0')
  assert.deepEqual(result, { ...original, NODE_OPTIONS: '', NODE_USE_SYSTEM_CA: '1' })
  assert.equal(original.NODE_OPTIONS, ' --use-system-ca ')
})

for (const version of ['22.19.0', '24.6.0', '25.0.0']) {
  test(`supports system CA environment in Node ${version}`, () => {
    assert.equal(buildEnvironment({ NODE_OPTIONS: '--use-system-ca' }, 'win32', version).NODE_USE_SYSTEM_CA, '1')
  })
}

for (const version of ['22.18.0', '23.11.0', '24.5.0', '20.19.0', 'unknown']) {
  test(`does not reinterpret flags on unsupported Node ${version}`, () => {
    const env = { NODE_OPTIONS: '--use-system-ca' }
    assert.deepEqual(buildEnvironment(env, 'win32', version), env)
  })
}

for (const options of [undefined, '', '--max-old-space-size=4096', '--use-system-ca --trace-warnings', '"--use-system-ca"']) {
  test(`preserves absent, additional or unrecognized options: ${options}`, () => {
    const env = { NODE_OPTIONS: options, NODE_USE_SYSTEM_CA: '0' }
    assert.deepEqual(buildEnvironment(env, 'win32', '24.13.0'), env)
  })
}

test('preserves non-Windows environments', () => {
  const env = { NODE_OPTIONS: '--use-system-ca' }
  for (const platform of ['linux', 'darwin']) assert.deepEqual(buildEnvironment(env, platform, '24.13.0'), env)
})
