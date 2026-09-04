import type { Access, Where } from 'payload'

import { isOwner } from './owner'

const publishedAndActive: Where = {
  and: [
    { _status: { equals: 'published' } },
    { deletedAt: { exists: false } },
  ],
}

export const ownerOrPublished: Access = ({ req }) =>
  isOwner(req.user) ? true : publishedAndActive

export const ownerReadVersions: Access = ({ req }) => isOwner(req.user)
