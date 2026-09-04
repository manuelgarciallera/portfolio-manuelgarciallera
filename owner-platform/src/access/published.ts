import type { Access } from 'payload'

import { isOwner } from './owner'

export const ownerOrPublished: Access = ({ req }) =>
  isOwner(req.user) ? true : { _status: { equals: 'published' } }

export const ownerReadVersions: Access = ({ req }) => isOwner(req.user)
