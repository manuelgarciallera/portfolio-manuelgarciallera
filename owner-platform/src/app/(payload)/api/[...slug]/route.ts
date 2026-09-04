/* THIS FILE FOLLOWS PAYLOAD'S GENERATED EXISTING-APP SHIM. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

import { assertCurrentProductionRuntime } from '@/config/runtime'

const guarded = <Handler extends (...args: never[]) => unknown>(handler: Handler): Handler =>
  ((...args: Parameters<Handler>) => {
    assertCurrentProductionRuntime()
    return handler(...args)
  }) as Handler

export const GET = guarded(REST_GET(config))
export const POST = guarded(REST_POST(config))
export const DELETE = guarded(REST_DELETE(config))
export const PATCH = guarded(REST_PATCH(config))
export const PUT = guarded(REST_PUT(config))
export const OPTIONS = guarded(REST_OPTIONS(config))
