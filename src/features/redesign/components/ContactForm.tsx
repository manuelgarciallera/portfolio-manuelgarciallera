'use client'

import { FormEvent, useState } from 'react'
import { PROFILE_LINKS, SITE_EMAIL } from '../../../lib/site-config'

type FormStatus = 'idle' | 'sending' | 'success' | 'error'

const EMPTY_FORM = { name: '', email: '', company: '', message: '', website: '' }

export function ContactForm() {
  const [values, setValues] = useState(EMPTY_FORM)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')
  const [showFallback, setShowFallback] = useState(false)

  // Si la ruta falla, el visitante ya ha escrito su mensaje: perderlo y mandarle
  // a LinkedIn es la peor recuperacion posible. El mailto lo lleva consigo.
  const mailtoHref = `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(`Portfolio \u00b7 mensaje de ${values.name || 'un visitante'}`)}&body=${encodeURIComponent([values.company ? `Organizaci\u00f3n: ${values.company}` : '', values.email ? `Email: ${values.email}` : '', '', values.message].filter(Boolean).join('\n'))}`

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setFeedback('Enviando mensaje…')
    setShowFallback(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        setStatus('error')
        setFeedback(result.error || 'No se pudo enviar el mensaje.')
        setShowFallback(response.status >= 500)
        return
      }

      setValues(EMPTY_FORM)
      setStatus('success')
      setFeedback('Mensaje enviado. Gracias: te responderé personalmente.')
    } catch (error) {
      setStatus('error')
      setFeedback(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.')
      setShowFallback(true)
    }
  }

  const update = (field: keyof typeof EMPTY_FORM) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((current) => ({ ...current, [field]: event.target.value }))

  return (
    <form className="rd-contact-form rd-reveal" onSubmit={onSubmit}>
      <div className="rd-contact-form__field">
        <label htmlFor="contact-name">Nombre</label>
        <input id="contact-name" name="name" value={values.name} onChange={update('name')} autoComplete="name" maxLength={100} required />
      </div>
      <div className="rd-contact-form__field">
        <label htmlFor="contact-company">Organización <span>opcional</span></label>
        <input id="contact-company" name="company" value={values.company} onChange={update('company')} autoComplete="organization" maxLength={120} />
      </div>
      <div className="rd-contact-form__field rd-contact-form__field--wide">
        <label htmlFor="contact-email">Email</label>
        <input id="contact-email" name="email" type="email" inputMode="email" value={values.email} onChange={update('email')} autoComplete="email" maxLength={254} required />
      </div>
      <div className="rd-contact-form__field rd-contact-form__field--wide">
        <label htmlFor="contact-message">¿Qué podemos construir o investigar juntos?</label>
        <textarea id="contact-message" name="message" value={values.message} onChange={update('message')} rows={5} maxLength={5000} required />
      </div>
      <div className="rd-contact-form__trap" aria-hidden="true">
        <label htmlFor="contact-website">Sitio web</label>
        <input id="contact-website" name="website" value={values.website} onChange={update('website')} tabIndex={-1} autoComplete="off" />
      </div>
      <div className="rd-contact-form__actions">
        <p>Tu dirección se usa únicamente para responder a este mensaje.</p>
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'} <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className={`rd-contact-form__status is-${status}`} role="status" aria-live="polite">
        {feedback}{showFallback ? <> <a href={mailtoHref}>Enviarlo por correo <span aria-hidden="true">↗</span></a> <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">Abrir LinkedIn <span aria-hidden="true">↗</span></a></> : null}
      </p>
    </form>
  )
}
