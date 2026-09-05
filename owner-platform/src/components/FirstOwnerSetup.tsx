'use client'

import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'
import { registerFirstOwner } from '../security/bootstrap-client'
import styles from './FirstOwnerSetup.module.css'

export const FirstOwnerSetup = () => {
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inFlight.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    inFlight.current = true
    setPending(true)
    setError('')
    try {
      await registerFirstOwner({
        email: String(data.get('email') ?? ''), password: String(data.get('password') ?? ''),
        confirmation: String(data.get('confirmation') ?? ''), bootstrapSecret: String(data.get('installationKey') ?? ''),
      })
      form.reset()
      setComplete(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar la instalación.')
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }
  return <section className={styles.setup} aria-labelledby="owner-setup-title">
    <h1 id="owner-setup-title">Configura tu acceso owner</h1>
    {complete ? <div role="status">
      <h2>Cuenta creada</h2>
      <p>Elimina OWNER_BOOTSTRAP_SECRET de la configuración del servidor y reinícialo para cerrar la instalación.</p>
      <p>Tu portfolio público no ha cambiado.</p>
      <Link href="/admin/login">Ir a iniciar sesión</Link>
    </div> : <>
      <p>Este paso se realiza una sola vez. Crea tu cuenta privada para editar contenido y gestionar el CMS.</p>
      <details><summary>¿Dónde consigo la clave de instalación?</summary>
        <p>Es el valor de OWNER_BOOTSTRAP_SECRET configurado en el servidor por quien instala el CMS. Debe tener al menos 32 caracteres. No es tu contraseña ni una clave de IA.</p>
        <p>Si no está configurada, la creación de cuentas permanece deshabilitada. No se guarda en tus contenidos ni en el almacenamiento del navegador.</p>
      </details>
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending}>
          <legend>Datos de acceso</legend>
          <label>Correo electrónico<input type="email" name="email" autoComplete="username" required maxLength={254} /></label>
          <label>Contraseña<input type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-help" /></label>
          <small id="password-help">Entre 12 y 128 caracteres. Utiliza una contraseña única.</small>
          <label>Repite la contraseña<input type="password" name="confirmation" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
          <label>Clave de instalación<input type="password" name="installationKey" autoComplete="off" required minLength={32} maxLength={256} /></label>
          <button type="submit">{pending ? 'Creando cuenta…' : 'Crear mi cuenta owner'}</button>
        </fieldset>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </form>
      <p>¿Ya tienes acceso? <Link href="/admin/login">Inicia sesión</Link></p>
    </>}
  </section>
}
