import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { hashPublicationBundle, type PublicationBundle } from '../publication/bundle'

const immutableError = () => new APIError('Los paquetes de publicación son inmutables.', 403)

export const preparePublicationBundle: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const bundle = data.bundle as PublicationBundle
  let bundleHash: string
  try {
    bundleHash = hashPublicationBundle(bundle)
  } catch {
    throw new APIError('El paquete de publicación no supera la verificación de hash.', 400)
  }
  if (
    data.bundleHash !== bundleHash ||
    data.schemaVersion !== bundle.schemaVersion ||
    data.pageCount !== bundle.entries.length ||
    String(data.createdBy) !== String(req.user.id) ||
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    data.name.trim().length > 120
  ) throw new APIError('La procedencia o el recuento de páginas del paquete no coincide.', 400)
  return { ...data, name: data.name.trim() }
}

export const enforcePublicationBundleDelete: CollectionBeforeDeleteHook = async () => {
  throw immutableError()
}

export const PublicationBundles: CollectionConfig = {
  slug: 'publication-bundles',
  admin: {
    components: { edit: { beforeDocumentControls: ['./components/PublicationBundleControls#PublicationBundleControls'] } },
    defaultColumns: ['name', 'pageCount', 'bundleHash', 'createdAt'],
    useAsTitle: 'name',
  },
  access: {
    create: () => false,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [preparePublicationBundle],
    beforeDelete: [enforcePublicationBundleDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'pageCount', type: 'number', required: true, min: 1, max: 100, admin: { readOnly: true } },
    { name: 'bundle', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'bundleHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
