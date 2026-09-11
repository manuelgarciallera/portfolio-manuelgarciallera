import type { CollectionConfig, PayloadRequest } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { ownerForgotPassword } from '../auth/forgot-password'
import { lockRecoveryToken } from '../auth/recovery-lock'

// Server-owned operation marker: never trust a body/context flag for recovery.
const recoveryRequests = new WeakSet<PayloadRequest>()

export const Users: CollectionConfig = {
  slug: 'users',
  endpoints: [{ path: '/forgot-password', method: 'post', handler: ownerForgotPassword }],
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    useSessions: true,
    lockTime: 10 * 60 * 1000,
    maxLoginAttempts: 5,
  },
  hooks: {
    beforeOperation: [async ({ operation, req, args }) => {
      if (operation === 'resetPassword') {
        await lockRecoveryToken(req, args.data.token)
        recoveryRequests.add(req)
      }
      else recoveryRequests.delete(req)
    }],
    beforeValidate: [({ data, req }) => {
      if (recoveryRequests.delete(req) && data) {
        // Payload has validated the recovery token before this hook. Mutate the
        // user being saved in the same transaction, before adding the new session.
        data.sessions = []
        data.loginAttempts = 0
        data.lockUntil = null
      }
      return data
    }],
  },
  access: {
    admin: ({ req }) => isOwner(req.user),
    create: ownerOnly,
    delete: ownerOnly,
    read: ownerOnly,
    unlock: ownerOnly,
    update: ownerOnly,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'owner',
      options: [{ label: 'Owner', value: 'owner' }],
      required: true,
      saveToJWT: true,
    },
  ],
}
