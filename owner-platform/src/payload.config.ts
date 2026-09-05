import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig, type CollectionConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Projects } from './collections/Projects'
import { BrandProfiles } from './collections/BrandProfiles'
import { PreviewSnapshots } from './collections/PreviewSnapshots'
import { Releases } from './collections/Releases'
import { MediaPlacements } from './collections/MediaPlacements'
import { AuditEvents } from './collections/AuditEvents'
import { AssistanceProposals } from './collections/AssistanceProposals'
import { RestorePlans } from './collections/RestorePlans'
import { DraftSnapshots } from './collections/DraftSnapshots'
import { PublicationBundles } from './collections/PublicationBundles'
import { PublicationReviews } from './collections/PublicationReviews'
import { PublicationArtifacts } from './collections/PublicationArtifacts'
import { PublicationPreflights } from './collections/PublicationPreflights'
import { Technologies } from './collections/Technologies'
import { AnalyticsSnapshots } from './collections/AnalyticsSnapshots'
import { FigmaImportPlans } from './collections/FigmaImportPlans'
import { FigmaImportReviews } from './collections/FigmaImportReviews'
import { FigmaImportExecutions } from './collections/FigmaImportExecutions'
import { resolveRuntimeConfig } from './config/runtime'
import { multipartBodyParser, payloadUploadParsing } from './config/upload-security'
import { AssistantSettings } from './globals/AssistantSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const runtime = resolveRuntimeConfig({
  databaseUrl: process.env.DATABASE_URL,
  localDatabaseName: process.env.LOCAL_DATABASE_NAME || undefined,
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

const groupCollections = (group: string, collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((collection) => ({ ...collection, admin: { ...collection.admin, group } }))

export default buildConfig({
  admin: {
    components: {
      views: {
        createFirstUser: { Component: './components/FirstOwnerSetup#FirstOwnerSetup', path: '/create-first-user', exact: true },
      },
      beforeDashboard: [
        './components/OwnerSearch#OwnerSearch',
        './components/OwnerOverview#OwnerOverview',
        './components/AnalyticsImporter#AnalyticsImporter',
        './components/FigmaExplorer#FigmaExplorer',
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [
    ...groupCollections('Contenido', [Projects, Articles, Pages, Technologies]),
    ...groupCollections('Diseño y medios', [Media, MediaPlacements, BrandProfiles]),
    ...groupCollections('Workflow', [PreviewSnapshots, Releases, AssistanceProposals, RestorePlans, DraftSnapshots, PublicationBundles, PublicationReviews, PublicationArtifacts, PublicationPreflights, FigmaImportPlans, FigmaImportReviews, FigmaImportExecutions]),
    ...groupCollections('Sistema', [Users, AuditEvents, AnalyticsSnapshots]),
  ],
  globals: [AssistantSettings],
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
