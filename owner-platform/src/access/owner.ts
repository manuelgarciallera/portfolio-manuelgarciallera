import type { Access } from 'payload'

type OwnerIdentity = {
  collection?: unknown
  id?: unknown
  role?: unknown
}

export const isOwner = (user: unknown): user is OwnerIdentity => {
  if (!user || typeof user !== 'object') return false

  const candidate = user as OwnerIdentity

  return (
    candidate.collection === 'users' &&
    (typeof candidate.id === 'string' || typeof candidate.id === 'number') &&
    candidate.role === 'owner'
  )
}

export const ownerOnly: Access = ({ req }) => isOwner(req.user)
