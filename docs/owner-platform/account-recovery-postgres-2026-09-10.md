# Recovery on the actual PostgreSQL adapter

Base `b98fe0d`; reservation `2613690e-cdb6-457a-ac0f-a8d921a3042f`.

## Finding and correction

The recovery fixture hardcoded SQLite, even when invoked by test-integration-postgres.mjs. Prior recovery evidence was SQLite only. Added an actual adapter-name assertion: RED under the PostgreSQL controller reported sqlite instead of postgres. The failed run closed and removed its isolated cluster correctly.

The fixture now uses editorialDatabaseConfig to validate the controller's isolated PostgreSQL metadata (exact run root, loopback, database, role, password shape), and selects that pool. SQLite keeps its separate synthetic auth.db. No ambient production database URL is used; no runtime change or dependency added.

## Final evidence

- `node scripts/test-integration.mjs tests/auth-recovery.integration.test.ts`: seven SQLite HTTP cases passed.
- `OWNER_POSTGRES_BIN` resolved to existing owner-platform/node_modules/.cache/postgres-tools-17.11/unpacked/pgsql/bin; `node scripts/test-integration-postgres.mjs`: exit zero, 55 tests in seven files passed, including all seven recovery cases with asserted postgres adapter.
- Recovery covers token expiry/supersession/reuse, rejected delivery rollback and neutral REST receipt, malformed requests, session revocation, lockout recovery, late pre-commit rollback, preserved old access and retry.
- PostgreSQL 17.11; test process closed, zero remaining sessions, exact cluster stopped and only synthetic run root removed.
- Typecheck, lint and diff check passed. No build rerun for test-only change.

## Limits

The runner's legacy summary labels the suite editorial and engine postgres globally. Do not infer all 55 tests used PostgreSQL: auth-unlock still explicitly selects SQLite, and other fixture choices must be inspected individually. This change proves PostgreSQL for auth-recovery. No Neon/network/TLS/staging delivery, concurrent reset or post-commit failure claim. Public portfolio and protected checkpoint unchanged. Next Codex: close operational recovery gates and continue full editorial acceptance; no production activation implied.
