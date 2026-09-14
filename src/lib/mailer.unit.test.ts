import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { sendContactMessage } from './mailer'

// Replace only external delivery boundaries: routing, payload construction,
// header sanitation and error handling remain the production implementation.
const smtp = vi.hoisted(() => ({
  sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn(),
}))
vi.mock('nodemailer', () => ({ default: { createTransport: smtp.createTransport } }))
const http = vi.fn()
const submission = { name: 'Ana', email: 'visitor@example.invalid', company: 'Studio', message: 'Consulta de prueba' }

beforeEach(() => {
  vi.resetAllMocks()
  for (const key of ['CONTACT_TO_EMAIL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
    'SMTP_PORT', 'SMTP_FROM_NAME', 'RESEND_API_KEY', 'CONTACT_FROM_EMAIL']) vi.stubEnv(key, '')
  vi.stubEnv('CONTACT_TO_EMAIL', 'one@example.invalid, two@example.invalid')
  vi.stubGlobal('fetch', http)
  http.mockRejectedValue(new Error('Unexpected network delivery'))
  smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail, close: smtp.close })
  smtp.sendMail.mockResolvedValue({ messageId: 'synthetic' })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

function configureSmtp() {
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid')
  vi.stubEnv('SMTP_USER', 'owner@example.invalid')
  vi.stubEnv('SMTP_PASS', 'synthetic-not-a-secret')
}

it.each(['', ' , , '])('rejects missing recipients before attempting delivery: %j', async to => {
  configureSmtp()
  vi.stubEnv('CONTACT_TO_EMAIL', to)
  expect(await sendContactMessage(submission)).toEqual({ ok: false, reason: 'unconfigured' })
  expect(smtp.createTransport).not.toHaveBeenCalled()
  expect(http).not.toHaveBeenCalled()
})

it.each([[587, false, true], [465, true, false]])('requires encrypted SMTP on port %i', async (port, secure, requireTLS) => {
  configureSmtp()
  vi.stubEnv('SMTP_PORT', String(port))
  vi.stubEnv('RESEND_API_KEY', 'synthetic-alternative')
  expect(await sendContactMessage(submission)).toEqual({ ok: true, transport: 'smtp' })
  expect(smtp.createTransport).toHaveBeenCalledWith(expect.objectContaining({ port, secure, requireTLS }))
  expect(smtp.sendMail).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    from: { name: 'Portfolio', address: 'owner@example.invalid' },
    replyTo: { name: 'Ana', address: 'visitor@example.invalid' },
    to: ['one@example.invalid', 'two@example.invalid'],
    text: 'Nombre: Ana\nEmail: visitor@example.invalid\nOrganización: Studio\n\nConsulta de prueba',
  }))
  expect(smtp.close).toHaveBeenCalledOnce()
  expect(http).not.toHaveBeenCalled()
})

it('does not attempt a second provider after an ambiguous SMTP failure', async () => {
  configureSmtp()
  vi.stubEnv('RESEND_API_KEY', 'synthetic-alternative')
  smtp.sendMail.mockRejectedValue(new Error('Connection lost after submission'))
  expect(await sendContactMessage(submission)).toEqual({ ok: false, reason: 'send-failed', detail: 'Connection lost after submission' })
  expect(smtp.close).toHaveBeenCalledOnce()
  expect(http).not.toHaveBeenCalled()
})

it('removes header line breaks without rewriting the message body', async () => {
  configureSmtp()
  vi.stubEnv('SMTP_FROM_NAME', 'Portfolio\r\nInjected')
  await sendContactMessage({ ...submission, name: 'Ana\r\nBcc: injected', message: 'Line 1\nLine 2' })
  expect(smtp.sendMail).toHaveBeenCalledWith(expect.objectContaining({
    from: { name: 'Portfolio Injected', address: 'owner@example.invalid' },
    replyTo: { name: 'Ana Bcc: injected', address: 'visitor@example.invalid' },
    subject: 'Portfolio · mensaje de Ana Bcc: injected',
    text: expect.stringContaining('Line 1\nLine 2'),
  }))
})

it('uses the configured alternative only when SMTP is unconfigured', async () => {
  vi.stubEnv('RESEND_API_KEY', 'synthetic-alternative')
  vi.stubEnv('CONTACT_FROM_EMAIL', 'owner@example.invalid')
  http.mockResolvedValue(new Response('{}', { status: 200 }))
  expect(await sendContactMessage(submission)).toEqual({ ok: true, transport: 'resend' })
  expect(smtp.createTransport).not.toHaveBeenCalled()
  expect(http).toHaveBeenCalledExactlyOnceWith('https://api.resend.com/emails', expect.objectContaining({
    method: 'POST', signal: expect.any(AbortSignal),
    body: JSON.stringify({ from: 'owner@example.invalid', to: ['one@example.invalid', 'two@example.invalid'],
      reply_to: 'visitor@example.invalid', subject: 'Portfolio · mensaje de Ana',
      text: 'Nombre: Ana\nEmail: visitor@example.invalid\nOrganización: Studio\n\nConsulta de prueba' }),
  }))
})

it('reports missing transport without trying a network request', async () => {
  expect(await sendContactMessage(submission)).toEqual({ ok: false, reason: 'unconfigured' })
  expect(http).not.toHaveBeenCalled()
  expect(smtp.createTransport).not.toHaveBeenCalled()
})

it('does not report provider rejection as delivery success', async () => {
  vi.stubEnv('RESEND_API_KEY', 'synthetic-alternative')
  http.mockResolvedValue(new Response('{}', { status: 429 }))
  expect(await sendContactMessage(submission)).toEqual({ ok: false, reason: 'send-failed', detail: 'resend 429' })
})

it('cancels a stalled alternative request at its deadline and returns a failure', async () => {
  vi.useFakeTimers()
  vi.stubEnv('RESEND_API_KEY', 'synthetic-alternative')
  http.mockImplementation((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal?.addEventListener('abort', () => reject(new Error('Request cancelled')), { once: true })
  }))
  let settled = false
  const delivery = sendContactMessage(submission).then(result => { settled = true; return result })
  await vi.advanceTimersByTimeAsync(11_999)
  expect(settled).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  expect(settled).toBe(true)
  expect(await delivery).toEqual({ ok: false, reason: 'send-failed', detail: 'Request cancelled' })
  expect(http).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it.each([200, 429])('removes the deadline timer after HTTP %i', async status => {
  vi.useFakeTimers()
  vi.stubEnv('RESEND_API_KEY', 'synthetic-alternative')
  http.mockResolvedValue(new Response('{}', { status }))
  expect(await sendContactMessage(submission)).toMatchObject({ ok: status === 200 })
  expect(vi.getTimerCount()).toBe(0)
})
