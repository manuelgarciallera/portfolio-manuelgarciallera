import { expect, it } from 'vitest'
import { resolveOwnerServerURL } from './server-url'

it('requires a canonical origin for production recovery links', () => {
  expect(() => resolveOwnerServerURL({ nodeEnv: 'production' })).toThrow(/OWNER_SERVER_URL/)
  expect(resolveOwnerServerURL({ nodeEnv: 'production', value: 'https://CMS.example.invalid/' })).toBe('https://cms.example.invalid')
})
it.each(['http://cms.example.invalid', 'https://user:secret@cms.example.invalid', 'https://cms.example.invalid/admin', 'https://cms.example.invalid/?x=1', 'https://cms.example.invalid/#x', ' https://cms.example.invalid', 'https://cms.example.invalid\n', 'https://cms.example.invalid\\evil', 'https://', 'file:///tmp', 'https://cms.example.invalid/?', 'https://cms.example.invalid/#'])('rejects an unsafe or ambiguous origin without echoing it', value => {
  expect(() => resolveOwnerServerURL({ value, nodeEnv: 'production' })).toThrow(/^OWNER_SERVER_URL must be an HTTPS origin without credentials, path, query or fragment$/)
})
it('allows explicit loopback HTTP only outside production', () => {
  for (const value of ['http://localhost:3013', 'http://127.0.0.1:3013', 'http://[::1]:3013']) {
    expect(resolveOwnerServerURL({ nodeEnv: 'development', value })).toBe(value)
    expect(() => resolveOwnerServerURL({ nodeEnv: 'production', value })).toThrow(/OWNER_SERVER_URL/)
  }
  expect(() => resolveOwnerServerURL({ value: 'http://localhost.attacker.invalid' })).toThrow(/OWNER_SERVER_URL/)
})
it.each(['https:cms.example.invalid', 'https://cms.example.invalid/a/..', 'https://@cms.example.invalid', 'https://cms.example.invalid/%2e'])('rejects URL parser repairs rather than silently changing intent', value => {
  expect(() => resolveOwnerServerURL({ value })).toThrow(/OWNER_SERVER_URL/)
})
it('keeps local omission and isolated builds free of external URLs', () => {
  expect(resolveOwnerServerURL({ nodeEnv: 'development' })).toBeUndefined()
  expect(resolveOwnerServerURL({ productionBuild: true, nodeEnv: 'production', value: 'https://private.example.invalid' })).toBeUndefined()
})
