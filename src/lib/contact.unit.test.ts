import { describe, expect, it } from 'vitest'

import { parseContactSubmission } from './contact'

describe('parseContactSubmission', () => {
  it('normalizes a valid submission and keeps only supported fields', () => {
    const result = parseContactSubmission({
      name: '  Ana García  ',
      email: ' ANA@example.com ',
      message: '  Me interesa hablar sobre un producto digital.  ',
      company: '  Estudio Norte ',
      website: '',
      ignored: 'not forwarded',
    })

    expect(result).toEqual({
      ok: true,
      data: {
        name: 'Ana García',
        email: 'ANA@example.com',
        message: 'Me interesa hablar sobre un producto digital.',
        company: 'Estudio Norte',
      },
    })
  })

  it('rejects malformed email and oversized or missing content', () => {
    expect(parseContactSubmission({ name: 'Ana', email: 'ana', message: 'Hola' })).toMatchObject({ ok: false })
    expect(parseContactSubmission({ name: '', email: 'ana@example.com', message: 'Hola' })).toMatchObject({ ok: false })
    expect(parseContactSubmission({ name: 'Ana', email: 'ana@example.com', message: 'x'.repeat(5001) })).toMatchObject({ ok: false })
  })

  it('silently accepts honeypot submissions without creating an email payload', () => {
    expect(parseContactSubmission({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'Spam',
      website: 'https://spam.invalid',
    })).toEqual({ ok: true, spam: true })
  })
})
