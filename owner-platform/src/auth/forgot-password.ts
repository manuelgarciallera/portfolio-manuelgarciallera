import { addDataAndFileToRequest, type PayloadHandler } from 'payload'
import { OwnerEmailDeliveryError } from '../config/email'

// Keep native token validation and transaction rollback. Only the REST receipt
// is neutralized; local callers still receive delivery failures.
export const ownerForgotPassword: PayloadHandler = async req => {
  await addDataAndFileToRequest(req)
  try {
    await req.payload.forgotPassword({
      collection: 'users',
      overrideAccess: false,
      data: { email: typeof req.data?.email === 'string' ? req.data.email : '' },
      req,
    })
  } catch (error) {
    if (!(error instanceof OwnerEmailDeliveryError)) throw error
    req.payload.logger.warn({ event: 'owner.auth.recovery.delivery_failed' }, 'Owner recovery delivery unavailable')
  }
  return Response.json({ message: req.t('general:success') }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
