import { APIError, type EmailAdapter } from 'payload'
export type OwnerEmailInput = { apiKey?: string; fromAddress?: string; nodeEnv?: string; productionBuild?: boolean }
const unavailable: EmailAdapter = () => ({
  name: 'owner-email-unconfigured', defaultFromName: 'CMS', defaultFromAddress: 'owner@example.invalid',
  sendEmail: async () => { throw new APIError('Owner email is not configured', 503) },
})
export const createOwnerEmailAdapter = ({ apiKey, fromAddress, nodeEnv, productionBuild }: OwnerEmailInput): EmailAdapter => {
  if (productionBuild) return unavailable
  if (!apiKey && !fromAddress && nodeEnv !== 'production') return unavailable
  if (!apiKey || !/^re_[A-Za-z0-9_-]+$/.test(apiKey) || !fromAddress ||
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(fromAddress)) {
    throw new Error('OWNER_EMAIL requires a valid API key and plain sender address')
  }
  return () => ({
    name: 'owner-resend-rest', defaultFromAddress: fromAddress, defaultFromName: 'CMS',
    sendEmail: async message => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10_000)
      try {
        // This adapter serves Payload authentication mail, not bulk/attachment mail.
        // Reject unsupported options rather than silently dropping their content.
        if (Object.keys(message).some(key => !['from', 'to', 'subject', 'html', 'text'].includes(key)) ||
          typeof message.to !== 'string' ||
          (message.html !== undefined && typeof message.html !== 'string') ||
          (message.text !== undefined && typeof message.text !== 'string')) throw new Error('Unsupported auth mail')
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: `CMS <${fromAddress}>`, to: message.to, subject: message.subject ?? '', html: message.html, text: message.text }),
        })
        if (!response.ok || !response.body) throw new Error('Provider rejected request')
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let size = 0
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.byteLength
            if (size > 65_536) throw new Error('Oversized receipt')
            chunks.push(value)
          }
        } finally { reader.releaseLock() }
        const receipt = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (!receipt || typeof receipt.id !== 'string' || !receipt.id.trim()) throw new Error('Missing receipt')
        return { id: receipt.id }
      } catch {
        // Do not leak provider messages, addresses or credentials to REST/logs.
        throw new APIError('Owner email delivery failed', 503)
      } finally { clearTimeout(timer); controller.abort() }
    },
  })
}
