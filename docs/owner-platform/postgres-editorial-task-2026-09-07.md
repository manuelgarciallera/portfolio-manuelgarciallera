# PostgreSQL editorial integration: complete the database parity gate

Continue the existing owner CMS plan and completion audit: PostgreSQL is the intended runtime, while the complete editorial services suite currently hardcodes SQLite. Physical PostgreSQL backup recovery is already implemented and reviewed; do not repeat or replace that task.

## Global constraints

- Work only in owner-platform tests/scripts and this task's dedicated report. Preserve application design, schema, access policies, public source/dependencies, checkpoint, all Claude files and other synthetic runs. No push/deploy, real data, real accounts, network provider, SMTP/Figma/AI call, new npm dependencies, global service or Docker repair.
- Use the existing portable PostgreSQL 17.11 binaries through OWNER_POSTGRES_BIN. Missing binaries fail early, not a green skip. Never accept an ambient arbitrary DATABASE_URL. A new command must create its own loopback-only cluster and synthetic credentials; cleanup must target only this run after verified process/server shutdown. Inherited credentials and Node injection options must not reach test workers.
- Follow TDD for new orchestration/selection/security helpers. The existing editorial tests characterize actual application behavior; do not call them new product features or weaken their assertions to make a second adapter pass.
- Keep all existing SQLite behavior and native PostgreSQL recovery intact. No blanket timeout increases, swallowed errors, forced green exits, broad filesystem cleanup or secret-bearing diagnostics. Reuse the reviewed bounded/redacted command helpers.

## Task 1: real PostgreSQL editorial suite

Add `npm run test:integration:postgres`, running the SAME complete `tests/editorial.integration.test.ts` suite (currently 22 cases) using the installed PostgreSQL adapter and a fresh synthetic database, not a handpicked subset or database mock. Keep `npm run test:integration` as SQLite by default. Separate engine selection/fixture initialization from business assertions without copying the test body.

Reuse or extract the small lifecycle orchestration from `scripts/test-recovery-postgres.mjs` and `tests/recovery/postgres-runtime.mjs` when genuinely shared, preserving its safety tests and diagnostic correction `4c2c32f`. Avoid duplicating cluster initialization/stop/cleanup logic wholesale. If a shared module changes, test both consumers. The stable existing binary cache is `C:/Develop/portfolio-manuelgarciallera/owner-platform/node_modules/.cache/postgres-tools-17.11/unpacked/pgsql/bin`.

The runner must initialize a fresh SCRAM cluster beneath ignored node_modules/.cache, bind only 127.0.0.1 at an unused port, create only its synthetic test database, and run Vitest in a bounded child. The fixture must use only the run's generated connection metadata, never the developer's DATABASE_URL or owner database. Do not log password-bearing URLs, tokens or raw diagnostic fragments. Confirm actual test process close and exact PostgreSQL shutdown before cleanup; preserve temporary synthetic state and the original error if closure is uncertain. Never overwrite/drop a pre-existing cluster or database.

The same real owner/session, releases and immutable snapshots, restored drafts, public/draft separation, optimistic freshness checks, audit-failure rollback, assistance review, Figma fixture transactions, publication preparation and partial edits must all run. Figma/provider behavior remains synthetic; database persistence and transactions must be real. Media remains isolated/disabled-local-storage as in the existing editorial suite; do not conflate this with object-storage verification. Development schema push is allowed only for this disposable test; production migration files and staging are not certified here.

Read the entire current editorial suite and installed adapter lifecycle implementation before changing setup. If PostgreSQL exposes an actual runtime defect, report the exact failing invariant and proposed source files to the controller before widening edit scope. Do not skip it, relax expectations, or substitute a narrower test. Baseline SQLite test results should be obtained before the setup refactor, then rerun afterward.

Verification: TDD helper red/green, full PostgreSQL editorial suite, full SQLite editorial regression, existing native PostgreSQL recovery (if lifecycle/shared helpers touched), SQLite recovery if worker/orchestration changed, lint and typecheck. No need to rerun 700 unrelated owner unit cases unless runtime source changes. Controller repeats committed PostgreSQL integration and supplies independent review. Document test counts honestly and distinguish Local API checks from browser/HTTP/provider coverage.

Write report `docs/owner-platform/postgres-editorial-report-2026-09-07.md` with files, exact commands/results, SHA/tool versions, failure/cleanup evidence, limitations and next responsible. Commit only your implementation and report; exclude this task brief, coordination docs, untracked AGENTS/CLAUDE files and public files. Before committing inspect the index; no mixed commits or lock removal. Return DONE/concerns, commit(s), short test summary and report path. No subagents.

## Controller ledger

- Previous goal turn: progress, not completion. PostgreSQL physical recovery and diagnostic correction are verified in d7fe885/4c2c32f; evidence e397e75/3537e3c. Goal remains active.
- Base: 3537e3c; existing non-main shared checkout verified. Public Hero/HeroOrb edits belong to Claude.
- Ruling: continue the established scoped owner lane without switching the shared branch or duplicating installs, honoring the user's continue-without-repeat-questions instruction. Risk: any overlapping edits require explicit handoff.
- Ruling: test all existing editorial invariants on PostgreSQL before object-storage integration, because a successful dump/restore does not prove release/rollback transactions on that engine. Cost if wrong: test orchestration rework, not altered public behavior.
- Preflight: one task, fixture adapter selection feeds the unchanged 22-case suite; shared lifecycle extraction feeds both editorial and recovery runners. No schema/access changes requested. Conflict risk is accidental relaxation of SQLite or cleanup contracts; both consumers must be verified.
- Task 1: implemented in `9e4a33a`, review correction `b3ef499`, independently verified (22 editorial cases and 27 helpers) and scoped delta review approved. Evidence: `postgres-editorial-report-2026-09-07.md`. Staging, migrations, durable object storage, account recovery, public bridge, CV/PDF and commercial readiness remain open.
