import type { Config } from 'payload'

export const MAX_UPLOAD_BYTES = 16 * 1024 * 1024

export const multipartBodyParser = {
  limits: {
    fieldSize: 1024 * 1024,
    fields: 6,
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    parts: 7,
  },
} satisfies NonNullable<Config['bodyParser']>

export const payloadUploadParsing = {
  abortOnLimit: true,
  responseOnLimit: 'Upload exceeds the 16 MB limit.',
  uploadTimeout: 30_000,
  // Payload's temp-file path is not used because rejected requests have no
  // guaranteed post-access cleanup. A strict 16 MB ceiling bounds memory.
  useTempFiles: false,
} satisfies NonNullable<Config['upload']>
