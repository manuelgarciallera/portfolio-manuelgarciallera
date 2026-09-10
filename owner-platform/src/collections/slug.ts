import { validations, type TextFieldValidation } from 'payload'
import { EDITORIAL_SLUG_ERROR, isEditorialSlug } from '../content/slug'

// A single URL segment, never a complete route or an encoded separator.
// Preserve authored case/Unicode; validation must not silently rename content.
export const validateSlug: TextFieldValidation = async (value, options) => {
  const standard = await validations.text(value, options)
  if (standard !== true) return standard
  if (value == null || value === '') return true
  return isEditorialSlug(value) ? true : EDITORIAL_SLUG_ERROR
}
