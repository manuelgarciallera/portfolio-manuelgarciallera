import type { CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    lockTime: 10 * 60 * 1000,
    maxLoginAttempts: 5,
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
