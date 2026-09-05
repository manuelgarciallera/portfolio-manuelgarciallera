export type FirstOwnerInput = { email: string; password: string; confirmation: string; bootstrapSecret: string }

export const registerFirstOwner = async (input: FirstOwnerInput, fetcher: typeof fetch = fetch): Promise<void> => {
  const email = input.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Introduce un correo válido.')
  if (input.password.length < 12 || input.password.length > 128) throw new Error('La contraseña debe tener entre 12 y 128 caracteres.')
  if (input.password !== input.confirmation) throw new Error('Las contraseñas no coinciden.')
  if (input.bootstrapSecret.length < 32 || input.bootstrapSecret.length > 256) throw new Error('La clave de instalación debe tener entre 32 y 256 caracteres.')
  let response: Response
  try {
    response = await fetcher('/api/users/first-register', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-owner-bootstrap-secret': input.bootstrapSecret },
      body: JSON.stringify({ email, password: input.password, role: 'owner' }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch { throw new Error('No se pudo contactar con el servidor. Comprueba la conexión y vuelve a intentarlo.') }
  if (response.ok) return
  if (response.status === 403) throw new Error('La clave de instalación no es válida o la instalación está deshabilitada. Comprueba OWNER_BOOTSTRAP_SECRET en el servidor.')
  if (response.status === 400 || response.status === 422) throw new Error('No se pudo crear la cuenta. Revisa los datos; si ya existe un owner, ve a iniciar sesión.')
  if (response.status === 409) throw new Error('La cuenta ya existe. Ve a iniciar sesión.')
  throw new Error('El servidor no ha podido completar la instalación. Inténtalo de nuevo más tarde.')
}
