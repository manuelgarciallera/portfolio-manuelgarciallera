# Initial PostgreSQL schema (candidate)

Generated offline from the active owner configuration at `5d026e4`, Payload 3.88.0. The TypeScript migration, native schema snapshot and index belong together. Generated TypeScript has unused function parameters removed and whitespace normalized; SQL statements are unchanged.

This catalog is **not connected to application startup or deployment**. It describes the active local-file Media collection, not the versioned object-storage fixture. Enabling that provider requires its own reviewed migration and operational checks.

## Two different paths

- **Empty PostgreSQL database:** use the reviewed initial baseline through the native migration runner, after deployment gates are approved. The integration test exercises this path with `push:false`.
- **Existing database:** do not apply the initial CREATE statements and do not blindly mark them as executed. Inventory schema/history and reconcile a restored clone first. The separate `database/migrations/20260910-restored-page-media.sql` is an earlier delta candidate for a specifically older schema, not the second migration in this catalog. The baseline already contains those fields.

No runtime settings have been changed to make either path automatic. Do not invoke migrate:fresh/reset/down on an existing installation: the generated down drops the schema and is not a data recovery procedure. Recovery requires compatible code, database and media backups with a tested restore.

## Generation

The one-time generator was run with:

```sh
node --conditions=react-server --import=tsx scripts/generate-postgres-baseline.mjs
```

It refuses a non-empty baseline directory, disables DB connections and telemetry, ignores ambient DB/email settings and generates with the installed Payload/Drizzle adapter. Re-running it is not an upgrade strategy. Future changes need a separate reviewed delta and matching snapshot; never rewrite applied migration history.

## Verification

`tests/postgres-baseline.integration.test.ts` runs only with the isolated PostgreSQL controller. It creates its own empty database inside that synthetic cluster, installs using native migrations, compares database table/column names with the snapshot, checks for missing migrations between the snapshot and active code schema, creates owner/media/page/version data and repeats migration without changing them or the migration ledger. It does not verify a real customer's database, object storage, deployment, or the destructive down path.
