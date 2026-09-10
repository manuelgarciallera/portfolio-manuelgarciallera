# Full owner configuration with object-backed media

Date: 2026-09-10. Base: `57381d8`. Codex owns integration; Hub reservation `06a7ba05`.

## Gap closed by this acceptance test

Previously the full CMS page/snapshot/restore path ran with filesystem revisions, while S3-backed REST media tests used a smaller configuration. The full editorial test now executes against both transports, with the real owner collections and actual database adapter. The object branch uses the installed S3 SDK and a loopback protocol fixture, never a real account.

The shared provider fixture was extracted from the existing object-media tests, preserving conditional writes and failure/corruption injection. Its in-memory state is deliberately not evidence of durable provider storage or provider authentication.

The expanded path checks upload A, page and brand assignment, immutable captures, replacement B, removal of old Media version rows, page restore using captured A, current shared Media retaining B, forged pin rejection, invalid unpin rollback, explicit unpin with title edit, unchanged published page and original snapshot. Object mode additionally checks exact original/replacement bytes in object storage, empty local storage directories and anonymous denial of the historical snapshot endpoint.

## Test infrastructure finding

First paired run failed (`d85ede`): the second schema had no users table. Installed `@payloadcms/drizzle/dist/utilities/pushDevSchema.js` caches raw tables globally without database/schema identity. The isolated setup now temporarily uses the adapter's force-push option during initialization, restoring the previous environment value in `finally`. This is test-only, after validation of loopback database and synthetic paths, not a production migration strategy. Fixture references are cleared during teardown to avoid closing a previous server twice when the next setup fails.

## Verification receipt

- PostgreSQL 17.11 focused full-config and object HTTP suites: 6/6, 64.98s (`51de35`), exit 0. Test process/database sessions closed and exact cluster cleaned.
- SQLite counterpart: 6/6, 64.40s (`1b4fea`), exit 0.
- Final complete integration run: 59/59 in 10 files, 131.99s (`339de2`), exit 0 and verified shutdown/cleanup under PostgreSQL 17.11 controller; auth-unlock retains its explicit SQLite fixture. Public boundary passed 21 entries (`4acd9b`); no runtime/public source changes and diff check clean.
- Typecheck/lint: exit 0 (`1cb676`). Expected rejected-input and failure-injection logs accompany passing assertions.
- No fresh browser/build claim: changed files are test infrastructure and documentation only.

## Scope limits

No application runtime code or active Media configuration changed. These tests exercise Payload REST and services, not Next rendering or browser UX. They do not certify Neon/R2, actual credentials, remote backups, durability across provider failures, real legacy-data migration, or production readiness. The next gate remains runtime binding and backup/staging acceptance before any authorized activation. No public files, dependencies, spending, push or deployment.
