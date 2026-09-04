export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  message: 5000,
} as const

export type ContactSubmission = {
  name: string
  email: string
  company: string
  message: string
}

type ContactParseResult =
  | { ok: true; data: ContactSubmission }
  | { ok: true; spam: true }
  | { ok: false; error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseContactSubmission(input: unknown): ContactParseResult {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Solicitud no válida.' }

  const source = input as Record<string, unknown>
  if (clean(source.website)) return { ok: true, spam: true }

  const name = clean(source.name ?? source.nombre)
  const email = clean(source.email)
  const company = clean(source.company)
  const message = clean(source.message ?? source.mensaje)

  if (!name || !email || !message) return { ok: false, error: 'Completa nombre, email y mensaje.' }
  if (name.length > CONTACT_LIMITS.name) return { ok: false, error: 'El nombre es demasiado largo.' }
  if (email.length > CONTACT_LIMITS.email || !EMAIL_PATTERN.test(email)) return { ok: false, error: 'Introduce un email válido.' }
  if (company.length > CONTACT_LIMITS.company) return { ok: false, error: 'El nombre de la organización es demasiado largo.' }
  if (message.length > CONTACT_LIMITS.message) return { ok: false, error: 'El mensaje supera los 5.000 caracteres.' }

  return { ok: true, data: { name, email, company, message } }
}
