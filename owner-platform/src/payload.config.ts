import { recoveryPostgresAdapter } from './auth/recovery-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { es } from '@payloadcms/translations/languages/es'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig, type CollectionConfig, type Config } from 'payload'
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
import { resolveOwnerServerURL } from './config/server-url'
import { createOwnerEmailAdapter } from './config/email'
import { multipartBodyParser, payloadUploadParsing } from './config/upload-security'
import { AssistantSettings } from './globals/AssistantSettings'
import { editorialLabels } from './config/editorial-labels'
import { configureMediaStorage } from './config/media-storage'

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

// SQLite disables transactions unless explicitly configured. Recovery relies on
// real rollback, so local development must exercise the same atomic contract.
export const createLocalDatabaseAdapter = (url: string) => sqliteAdapter({ client: { url }, transactionOptions: {} })

const db =
  runtime.database.kind === 'postgres'
    ? recoveryPostgresAdapter({ pool: { connectionString: runtime.database.url } })
    : createLocalDatabaseAdapter(runtime.database.url)

const groupCollections = (group: string, collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((collection) => ({ ...collection, labels: editorialLabels(collection.slug) ?? collection.labels, admin: { ...collection.admin, group } }))

// Fresh raw configuration lets isolated acceptance fixtures replace infrastructure
// without mutating an already sanitized app config or the default runtime.
export const createOwnerConfig = (): Config => ({
  email: createOwnerEmailAdapter({ apiKey: process.env.OWNER_EMAIL_API_KEY, fromAddress: process.env.OWNER_EMAIL_FROM, nodeEnv: process.env.NODE_ENV, productionBuild: runtime.productionBuild }),
  serverURL: resolveOwnerServerURL({ value: process.env.OWNER_SERVER_URL, nodeEnv: process.env.NODE_ENV, productionBuild: runtime.productionBuild }),
  // The owner interface is Spanish, like our custom controls. This is UI i18n,
  // not content localization: it adds no locale fields or schema migration.
  i18n: { fallbackLanguage: 'es', supportedLanguages: { es } },
  admin: {
    components: {
      afterNav: ['./components/OwnerNavigationAccessibility#OwnerNavigationAccessibility'],
      views: {
        pagePreview: { Component: './components/PagePreviewView#PagePreviewView', path: '/page-preview/:id', exact: true },
        contentPreview: { Component: './components/PagePreviewView#PagePreviewView', path: '/content-preview/:collection/:id', exact: true },
        snapshotPreview: { Component: './components/PagePreviewView#PagePreviewView', path: '/snapshot-preview/:id', exact: true },
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
  globals: [{ ...AssistantSettings, label: 'Permisos del asistente' }],
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

export default configureMediaStorage(createOwnerConfig(), process.env).then(buildConfig)
