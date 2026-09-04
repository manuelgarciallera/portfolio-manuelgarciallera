/* THIS FILE FOLLOWS PAYLOAD'S GENERATED EXISTING-APP SHIM. */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

import { assertCurrentProductionRuntime } from '@/config/runtime'

const post = GRAPHQL_POST(config)
const options = REST_OPTIONS(config)

export const POST: typeof post = (...args) => {
  assertCurrentProductionRuntime()
  return post(...args)
}

export const OPTIONS: typeof options = (...args) => {
  assertCurrentProductionRuntime()
  return options(...args)
}
