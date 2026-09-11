# Recovery admission schema: verification record

Base `14a1eb6`. Proposal sent to Claude: `05b95477-5d62-4023-8ed8-ebd25913affe`.
This is the schema gate following the standalone admission mechanism; not HTTP
activation, production deployment or completion of the whole CMS.

## Implementation

- `owner-platform/src/auth/recovery-postgres.ts`: candidate adapter with a private
  schema table and bounded pool acquisition. Preserves existing schema hooks and
  rejects registration conflicts. Uses exported installed APIs, no new dependency.
- `owner-platform/scripts/generate-recovery-admission-migration.mjs`: explicit
  offline native generator, refuses existing output, copies the previous snapshot
  into a fresh temporary directory and writes a separate additive catalog.
- `owner-platform/database/recovery-admission`: generated SQL, full snapshot and
  index reusing both previous migrations without editing them.
- Unit and PostgreSQL migration tests: real installed schema hook, no collection
  exposure, bounded configuration, existing content and version preservation,
  native schema parity, repeated migration and instance reopen.

## Evidence and corrections

1. RED unit `780666`: missing adapter implementation. GREEN offline unit eight
   cases; no DB pool acquired. Initial TypeScript errors exposed the schema hook's
   narrower adapter type and incompatible builder overload union. Resolved with
   exported `pgSchema`/`pgTable` and an explicit `PgTableFn<string | undefined>`,
   without `any` or runtime casts to hide the mismatch.
2. Generator `9892e5`, exit 0, generated `20260911_062311_recovery_admission`.
   Repeat `b21760` intentionally exits 1 with the existing-catalog guard before
   writing anything. Existing baseline/object-storage catalogs have no Git diff.
3. First PostgreSQL attempt `73e3ec` failed on reopen: the fixture reused raw
   configuration mutated by Payload sanitization, duplicating `payload-kv`.
   The fixture now invokes `createOwnerConfig` and media binding for every open.
   No Payload runtime code was changed to work around this fixture bug.
4. Rerun `d9394d`, Node 24.18 / PostgreSQL 16.15: **20 tests / three files passed**
   (new migration, nine admission tests, ten native recovery tests). SQL migration
   installs after existing data, preserves earlier ledger rows and versions,
   reports no native schema delta, and survives repeat and instance reopen.
   The runner verified process/session shutdown and removed only its synthetic
   run root. No real provider or application database was used.
5. Complete unit suite `b9e57c`: **1,280 tests / 169 files passed**. Strict
   typecheck and focused lint were run again after the fixture correction.
6. Independent internal read-only review: no important defect found. Snapshot
   comparison found exactly one added table, no existing table changes. Reviewer
   correctly limited migration evidence to `public`; named-schema registration
   tests are not named-schema migration evidence. Claude acceptance not inferred.

## Next gate — Codex

Connect the candidate adapter, catalog and REST admission in a coordinated change.
Test limited/known/unknown receipt equivalence, malformed input, missing table,
provider failure without refund, no token rotation on rejection and preservation
of native recovery/session guarantees. Rehearse full DB/object recovery with the
third migration. Keep the public portfolio untouched; no deployment or public push.
