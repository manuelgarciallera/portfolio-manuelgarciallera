// Shared by editorial input and historical publication checks. No normalization:
// a stored identifier must never silently change while being validated.
export const isEditorialSlug = (value: unknown): value is string =>
  typeof value === 'string' && value === value.trim() &&
  /^[\p{L}\p{N}_-][\p{L}\p{M}\p{N}._-]{0,119}$/u.test(value)

export const EDITORIAL_SLUG_ERROR = 'Escribe un identificador de URL de hasta 120 caracteres: letras, números, guiones o guiones bajos; admite puntos salvo al inicio. Sin espacios, barras, direcciones completas, parámetros ni fragmentos.'
