import { resendAdapter } from '@payloadcms/email-resend'
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
  const adapter = resendAdapter({ apiKey, defaultFromAddress: fromAddress, defaultFromName: 'CMS' })
  return args => {
    const transport = adapter(args)
    return { ...transport, sendEmail: async message => {
      try {
        const receipt = await transport.sendEmail({ ...message, from: `CMS <${fromAddress}>` })
        if (!('id' in receipt) || typeof receipt.id !== 'string' || !receipt.id.trim()) throw new Error('Missing receipt')
        return { id: receipt.id }
      } catch {
        // Do not leak provider messages, addresses or credentials to REST/logs.
        throw new APIError('Owner email delivery failed', 503)
      }
    } }
  }
}
