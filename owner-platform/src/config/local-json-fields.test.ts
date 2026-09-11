import { describe, expect, it } from 'vitest'
import type { Field } from 'payload'
import { localJSONFields } from './local-json-fields'

describe('local JSON field integration', () => {
  it('adds local initialization without losing field permissions or admin properties', () => {
    const read = () => false
    const fields: Field[] = [{ name: 'evidence', type: 'json', required: true, access: { read }, admin: { readOnly: true, description: 'Evidence' } }]
    const [result] = localJSONFields(fields)
    expect(result).toMatchObject({ name: 'evidence', type: 'json', required: true, access: { read },
      admin: { readOnly: true, description: 'Evidence', components: { Field: './components/LocalJSONField#LocalJSONField' } } })
    expect(fields[0].admin).not.toHaveProperty('components')
  })

  it('preserves an explicit custom field and non-JSON fields', () => {
    const fields: Field[] = [{ name: 'name', type: 'text' }, { name: 'custom', type: 'json', admin: { components: { Field: './Custom' } } }]
    expect(localJSONFields(fields)).toEqual(fields)
  })
})
