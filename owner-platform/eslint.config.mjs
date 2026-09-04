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
    'next-env.d.ts',
    'src/payload-types.ts',
  ]),
])
