# Recovery admission schema — candidate, not activated

This catalog reuses `database/object-storage`, including the immutable baseline,
then adds `20260911_062311_recovery_admission`. The generated UP creates only
`public.owner_recovery_admissions`, its primary key, two constraints and an expiry
index. It does not alter existing content, users, media or versions.

The table is registered through `recoveryPostgresAdapter` using Payload 3.88's
supported schema hook and its exported Drizzle builders. It is not a collection,
so no content editor or collection REST resource is created. Pool acquisition
defaults to 5 seconds; explicit values must be between 1 and 10,000 milliseconds.

## What is verified

- Offline generation acquired no database pool. Re-running the generator rejects
  the existing catalog instead of overwriting migration history.
- PostgreSQL 16.15, `push:false`: install the two previous migrations, create and
  edit a page, then apply this additive migration. Content, versions and previous
  ledger rows remain unchanged. The new migration is recorded once in batch 2.
- The native schema generator reports no delta between the new snapshot and the
  registered runtime schema. Independent review found only the new table in the
  snapshot diff; earlier tables are unchanged.
- Repeating migrations and reopening a fresh Payload instance preserve the ledger,
  page versions and admission cooldown. This is instance reopen, not host recovery.

The generated catalog targets **public only**. A separate offline unit test covers
registration under a named schema, but does not prove its migration. Never apply
this catalog to another search path and assume equivalent results.

## Activation and recovery boundary

Neither the adapter nor the catalog is wired to application startup yet. The
forgot-password endpoint is unchanged and does not yet consume this budget.
Next gate: explicit adapter/catalog selection, HTTP acceptance, provider outage
and existing-token preservation tests, production-build regression and full
backup/restore rehearsal with the third migration and persisted counters.

Do not execute the generated DOWN as an operational rollback: dropping this table
discards abuse budgets. Use a coordinated compatible backup and restore plan.
Do not mark migrations applied merely to silence schema drift. No real database,
provider, upload or public site was changed during this work.

Evidence: `docs/owner-platform/recovery-schema-verification-2026-09-11.md` in the
repository root. The generator lives in `scripts/generate-recovery-admission-migration.mjs`.
