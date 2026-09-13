import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.data/**',
    '.next/**',
    'media/**',
    'node_modules/**',
    // Copied verbatim from the installed editor package by prepare-editor-assets.
    // Authored public scripts and the rest of the owner sources stay linted.
    'public/vendor/monaco/**',
    'next-env.d.ts',
    'src/payload-types.ts',
  ]),
])
