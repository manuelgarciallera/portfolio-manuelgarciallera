import { describe, expect, it } from 'vitest'
import { validations, type TextField, type TextFieldValidation } from 'payload'
import { slugField } from './shared'

const options = { required: true, req: { payload: { config: {} }, t: (key: string) => key } } as unknown as Parameters<TextFieldValidation>[1]
// Exercise the actual configured validation, including Payload's existing fallback.
const configuredValidation = ((slugField as TextField).validate ?? validations.text) as TextFieldValidation
const validate = (value: unknown) => configuredValidation(value as string, options)

describe('editorial URL identifiers', () => {
  it.each(['sobre-mi', 'diseño', 'e\u0301tude', 'case_2', 'version-2.1', 'Project2026'])('preserves a valid single segment: %s', async value => {
    expect(await validate(value)).toBe(true)
  })
  it.each(['mi página', ' proyecto', 'proyecto ', 'https://example.com', '/sobre-mi', 'a/b', '..', '.', 'a\\b', 'a?b=1', 'a#seccion', '%2Fadmin', 'a\n', 'x'.repeat(121), ['page'], 42].map(value => ({ value })))('rejects malformed identifiers with a field error: $value', async ({ value }) => {
    expect(typeof await validate(value)).toBe('string')
  })
  it.each([undefined, null, ''])('keeps required validation for %s', async value => {
    expect(await validate(value)).toBe('validation:required')
  })
})
