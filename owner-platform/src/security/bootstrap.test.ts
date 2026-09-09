import { describe, expect, it } from 'vitest'

import { authorizeFirstUserBootstrap, isFirstUserBootstrapPath } from './bootstrap'

describe('first-owner bootstrap gate', () => {
  it('guards encoded and trailing-slash forms of the registration endpoint', () => {
    for (const path of ['/api/users/first%2Dregister', '/api/%75sers/first-register', '/api/users/first-register/', '/api/users/FIRST-REGISTER']) {
      expect(isFirstUserBootstrapPath(`http://localhost:3000${path}`)).toBe(true)
    }
    expect(isFirstUserBootstrapPath('http://localhost:3000/api/users/first%252Dregister')).toBe(false)
    expect(isFirstUserBootstrapPath('http://localhost:3000/api/users/%broken')).toBe(false)
  })
  it('recognizes only the exact Payload first-register endpoint', () => {
    expect(isFirstUserBootstrapPath('http://localhost:3000/api/users/first-register')).toBe(true)
    expect(isFirstUserBootstrapPath('http://localhost:3000/api/users/login')).toBe(false)
    expect(isFirstUserBootstrapPath('http://localhost:3000/api/users/first-register/extra')).toBe(false)
  })

  it('denies registration when either bootstrap secret is missing', () => {
    expect(authorizeFirstUserBootstrap(undefined, undefined)).toBe(false)
    expect(authorizeFirstUserBootstrap('configured-secret', undefined)).toBe(false)
    expect(authorizeFirstUserBootstrap(undefined, 'provided-secret')).toBe(false)
  })

  it('accepts only an exact bootstrap secret match', () => {
    const secret = 'one-time-owner-bootstrap-secret-with-entropy'

    expect(authorizeFirstUserBootstrap(secret, secret)).toBe(true)
    expect(authorizeFirstUserBootstrap(secret, `${secret}-wrong`)).toBe(false)
  })
})
