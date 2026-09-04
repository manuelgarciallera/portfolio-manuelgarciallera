import { describe, expect, it } from 'vitest'

import {
  MAX_UPLOAD_BYTES,
  multipartBodyParser,
  payloadUploadParsing,
} from './upload-security'

describe('multipart upload security', () => {
  it('bounds every multipart dimension before Payload reads it', () => {
    expect(MAX_UPLOAD_BYTES).toBe(16 * 1024 * 1024)
    expect(multipartBodyParser).toEqual({
      limits: {
        fieldSize: 1024 * 1024,
        fields: 6,
        fileSize: MAX_UPLOAD_BYTES,
        files: 1,
        parts: 7,
      },
    })
  })

  it('aborts oversized streams instead of retaining a truncated upload', () => {
    expect(payloadUploadParsing).toMatchObject({
      abortOnLimit: true,
      responseOnLimit: 'Upload exceeds the 16 MB limit.',
      uploadTimeout: 30_000,
      useTempFiles: false,
    })
  })
})
