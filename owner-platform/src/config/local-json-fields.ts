import type { Field } from 'payload'

// Current owner JSON evidence fields are top-level; no schema/data mutation.
export const localJSONFields = (fields: Field[]): Field[] => fields.map(field => {
  if (field.type !== 'json' || field.admin?.components?.Field) return field
  return { ...field, admin: { ...field.admin, components: { ...field.admin?.components,
    Field: './components/LocalJSONField#LocalJSONField' } } }
})
