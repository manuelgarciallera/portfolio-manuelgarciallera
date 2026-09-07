/* THIS FILE FOLLOWS PAYLOAD'S GENERATED EXISTING-APP SHIM. */
import config from '@payload-config'
import '@payloadcms/next/css'
import './owner-shell.css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import type { ReactNode } from 'react'

import { assertCurrentProductionRuntime } from '@/config/runtime'
import { importMap } from './admin/importMap.js'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  assertCurrentProductionRuntime()
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
