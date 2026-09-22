import { type FormHTMLAttributes, type ReactElement, type SubmitEvent } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContactForm } from './ContactForm'

// Exercise the real submit handler and rendered status in the node test suite.
// This small state adapter does not claim to test browser form validation or focus.
const state = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0 }))
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: <T,>(initial: T) => {
    const index = state.cursor++
    if (!(index in state.values)) state.values[index] = initial
    return [state.values[index], (value: T) => { state.values[index] = value }]
  },
}))

afterEach(() => {
  state.values = []
  state.cursor = 0
  vi.unstubAllGlobals()
})

function renderForm() {
  state.cursor = 0
  return ContactForm() as ReactElement<FormHTMLAttributes<HTMLFormElement>>
}

describe('contact form network failure', () => {
  it('shows a Spanish recovery message and alternate contact links without exposing the transport error', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch: internal-network-detail') })
    const form = renderForm()
    await form.props.onSubmit?.({ preventDefault() {} } as SubmitEvent<HTMLFormElement>)

    const html = renderToStaticMarkup(renderForm())
    expect(html).toContain('No se ha podido enviar el mensaje. Comprueba tu conexión o utiliza el correo electrónico.')
    expect(html).not.toContain('internal-network-detail')
    expect(html).not.toContain('Failed to fetch')
    expect(html).toContain('Enviarlo por correo')
    expect(html).toContain('mailto:')
    expect(html).toContain('Abrir LinkedIn')
    expect(html).not.toContain('disabled=')
  })
})
