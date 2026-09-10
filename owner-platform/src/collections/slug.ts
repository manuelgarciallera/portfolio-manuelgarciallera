import { validations, type TextFieldValidation } from 'payload'

// A single URL segment, never a complete route or an encoded separator.
// Preserve authored case/Unicode; validation must not silently rename content.
export const validateSlug: TextFieldValidation = async (value, options) => {
  const standard = await validations.text(value, options)
  if (standard !== true) return standard
  if (value == null || value === '') return true
  if (typeof value === 'string' && value === value.trim() &&
    /^[\p{L}\p{N}_-][\p{L}\p{M}\p{N}._-]{0,119}$/u.test(value)) return true
  return 'Escribe un identificador de URL de hasta 120 caracteres: letras, números, guiones o guiones bajos; admite puntos salvo al inicio. Sin espacios, barras, direcciones completas, parámetros ni fragmentos.'
}
