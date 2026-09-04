import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Projects } from './collections/Projects'
import { resolveRuntimeConfig } from './config/runtime'
import { multipartBodyParser, payloadUploadParsing } from './config/upload-security'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const runtime = resolveRuntimeConfig({
  databaseUrl: process.env.DATABASE_URL,
  nextPhase:
    process.env.OWNER_PLATFORM_BUILD_PHASE === '1'
      ? 'phase-production-build'
      : process.env.NEXT_PHASE,
  nodeEnv: process.env.NODE_ENV,
  payloadSecret: process.env.PAYLOAD_SECRET,
})

const db =
  runtime.database.kind === 'postgres'
    ? postgresAdapter({ pool: { connectionString: runtime.database.url } })
    : sqliteAdapter({ client: { url: runtime.database.url } })

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [Users, Media, Projects, Articles, Pages],
  bodyParser: multipartBodyParser,
  db,
  editor: lexicalEditor(),
  graphQL: {
    disable: true,
  },
  secret: runtime.payloadSecret,
  sharp,
  upload: payloadUploadParsing,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
