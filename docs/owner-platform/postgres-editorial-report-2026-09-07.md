# PostgreSQL editorial integration report

Date: 2026-09-07

Author: Codex implementation lane

Status: implemented, independently reviewed and locally verified on the final fix commit

Scope: Task 1 from `postgres-editorial-task-2026-09-07.md`

## Outcome

The unchanged complete `tests/editorial.integration.test.ts` business suite now runs against either its existing isolated SQLite fixture or a fresh real PostgreSQL database. `npm run test:integration` remains SQLite by default. `npm run test:integration:postgres` preflights the existing portable PostgreSQL tools, creates a unique cluster and the single `owner_editorial` database beneath ignored `node_modules/.cache`, runs the same 22 cases in a bounded child, waits for that exact process to close, verifies zero remaining database sessions, stops the exact cluster and removes only that run root.

No application runtime, schema, access rule, public source, dependency, lockfile, production migration, service or deployment was changed. Development schema push occurs only inside the disposable PostgreSQL test database.

Start base: `5f3f228e7fe59b032d0a522ed76f8d95f6b0d201`. Concurrent Claude public-only commits advanced shared HEAD through `e04487b92cb24efdc142d8746326709348288e2b` and later `1abb270`; they were preserved and are not part of this implementation delta.

Initial implementation/report commit: `9e4a33afe651d36ab0cc9a50ab38d23e57e4b714`. Review correction: `b3ef499227a9d0e1e018b6cea9d0cca42eb725e2`. The shared Git lock disappeared externally before normal exact-path staging; no lock deletion or alternate-index bypass was performed.

## Files in this task

- `owner-platform/package.json`: adds only `test:integration:postgres`.
- `owner-platform/scripts/test-integration-postgres.mjs`: bounded real-PostgreSQL editorial runner.
- `owner-platform/tests/editorial.integration.test.ts`: selects the validated fixture adapter without copying or changing the 22 business assertions; PostgreSQL socket ownership stays at the disposable process boundary.
- `owner-platform/tests/recovery/postgres-runtime.mjs`: small shared cluster lifecycle plus strict editorial fixture selection; retains bounded/redacted command diagnostics from `4c2c32f`.
- `owner-platform/tests/recovery/postgres-runtime.test.mjs`: TDD coverage for adapter metadata isolation and exact lifecycle roots.
- `owner-platform/scripts/test-recovery-postgres.mjs`: existing native recovery consumer refactored onto the shared lifecycle.
- `docs/owner-platform/postgres-editorial-report-2026-09-07.md`: this evidence.

The task brief, coordination documents, public files, untracked `AGENTS.md`/`CLAUDE.md`, media-gap report and all unrelated artifacts are explicitly excluded.

## Environment and safety contract

- Node `v24.13.0`, npm `11.13.0`, Vitest `4.1.10`, Payload and both installed database adapters `3.88.0`.
- `OWNER_POSTGRES_BIN=C:\Develop\portfolio-manuelgarciallera\owner-platform\node_modules\.cache\postgres-tools-17.11\unpacked\pgsql\bin`.
- `initdb`, `pg_ctl`, `psql`, `createdb`, `pg_dump` and `pg_restore` all reported PostgreSQL `17.11`.
- Missing/invalid tools fail during preflight before any run root. No ambient `DATABASE_URL`, PostgreSQL service variables, connector secrets, bootstrap secret or Node injection options are forwarded to the test child.
- PostgreSQL metadata is accepted only for host `127.0.0.1`, database/user `owner_editorial`, a generated 64-hex password, `ssl: false`, the chosen valid port and a real exact child root matching `owner-postgres-editorial-*` directly beneath the owner cache. Unexpected fields, alternate hosts/databases/users and weak credentials are rejected.
- `initdb` uses SCRAM for host and local authentication. The generated config binds only `127.0.0.1`, disables Unix sockets and fixes the chosen unused port; live queries verify loopback and the SCRAM verifier.
- Cleanup requires proved child closure and proved exact-cluster shutdown. Failed/incomplete initialization or uncertain closure retains the synthetic root. When both the task and cleanup fail, the original task error remains primary. No password-bearing URL or raw incomplete diagnostic is printed.

## TDD and verification evidence

All commands ran from `owner-platform` on Windows unless noted.

1. Baseline SQLite before edits: `npm run test:integration`.
   - First unchanged attempt: exit `1`; Vitest worker exited unexpectedly after reporting 18 passed of 22, with no assertion failure; duration `25.37s`. This matches a previously observed intermittent worker-exit category but its cause remains undetermined.
   - One unchanged repeat: exit `0`; 1 file, 22/22 passed; duration `26.17s`.
2. TDD RED: `node node_modules/vitest/vitest.mjs run tests/recovery/postgres-runtime.test.mjs --config vitest.recovery.config.ts`.
   - Exit `1`; 2 expected failures (`editorialDatabaseConfig` and `createPostgresCluster` absent), 9 prior tests passed; duration `1.71s`.
3. TDD GREEN, same focused command.
   - Exit `0`; 11/11 passed; duration `2.16s`.
4. First real PostgreSQL editorial run: `$env:OWNER_POSTGRES_BIN='...\pgsql\bin'; npm run test:integration:postgres`.
   - Exit `1`; Vitest reported an `afterAll` hook timeout while waiting on `pool.end()`. No complete business-test count was emitted, so this run is not counted as an editorial pass. The installed adapter acquires an initial pool client and installed Drizzle `destroy` clears adapter state but does not end that pool; this is the same lifecycle limitation already handled by the reviewed recovery worker.
   - The runner propagated the nonzero result, then verified exact cluster shutdown and removed only its synthetic root. The failure was not converted to green.
5. PostgreSQL editorial after the test-only lifecycle correction, same command.
   - Exit `0`; the same 1 file and 22/22 cases passed; Vitest duration `28.05s`, test time `18.71s`.
   - Parent runner observed actual Vitest child close, then queried 0 other sessions in `owner_editorial`, stopped the exact cluster, confirmed removal of `postmaster.pid` and removed only the run root.
   - Controller's independent frozen-snapshot repeat also exited `0`, 22/22 in `27.73s`, with clean sessions and shutdown.
6. SQLite editorial after the fixture refactor: `npm run test:integration`.
   - Exit `0`; 1 file, 22/22 passed; duration `21.89s`.
7. First refactored native PostgreSQL recovery: `$env:OWNER_POSTGRES_BIN='...\pgsql\bin'; npm run test:recovery:postgres`.
   - Helpers 26/26 passed; the real run seeded, closed its worker and produced a native dump, then exited `1` on a missing retained `writeFile` import before corrupt-archive verification. Exact cluster shutdown/root cleanup still passed. The import was restored; no assertion or runtime contract was changed.
8. Native PostgreSQL recovery repeat, same command.
   - Exit `0`; helpers 26/26; 5 backup files, custom `PGDMP`, 4 media files and 2 page versions verified; corrupt and missing archives rejected; source state unchanged; source sessions closed; exact cluster stopped and run root removed.
9. SQLite physical recovery: `npm run test:recovery`.
   - Exit `0`; helpers 26/26 plus 12 workflow checks; 5 backup files, 0 observed sidecars, 4 media files and 2 page versions restored.
10. `npm run lint`: exit `0` (final run).
11. `npm run typecheck`: the first post-change run exited `1` on test-harness adapter return typing; explicit test adapter metadata corrected it. Final run exit `0`.
12. Scoped `git diff --check`: exit `0`. Final process/cache inspection found no `postgres.exe` processes and no `owner-postgres-editorial-*` or `owner-postgres-recovery-*` run roots.

The helper suite also retains the earlier nonzero subprocess, timeout, max-buffer and split-diagnostic cases. These prove a child failure is rejected and incomplete diagnostics are omitted rather than leaking credential fragments.

## Coverage and limitations

The 22 cases are Local API/Payload integration checks using a real owner session, real PostgreSQL persistence and transactions. They cover releases and immutable snapshots, partial edits, block identities, frozen assistance context/review and audit rollback, publication preparation, synthetic Figma-plan transactions, restore success/freshness/audit rollback, draft/public isolation, version history, modular article/project content, uploads with local storage disabled, and visual-preview service output.

This is not browser or HTTP coverage. Figma discovery/download remains synthetic; no network provider was called. Media storage is deliberately disabled/local-isolated and this run does not verify durable object storage. It does not certify production migrations, staging, backups, account recovery, a public bridge, PDF/CV support, email, deployment, accessibility, performance or commercial readiness. PostgreSQL development schema push is evidence only for the disposable test database.

The installed PostgreSQL adapter's checked-out initial pool client means the suite must rely on its bounded disposable process exiting after `Payload.destroy()`; the parent independently verifies process close and zero sessions before server shutdown. This is an explicit harness boundary, not a claim that the installed adapter closes pools in a long-lived production process.

Successful editorial runs emit Payload's expected warning that no email adapter is configured. The suite does not send mail and this warning is not evidence of email delivery or configuration.

## Next responsible

Controller/Codex: the committed repetition and scoped review are complete, as recorded below. Next requirements remain reviewed production migrations, staging with durable database/media backup and restore, account recovery and the controlled public bridge. Claude's public lane and the separately documented media operational gaps remain outside these implementation commits.

## Round-one lifecycle review correction

Independent review of `9e4a33a` found that `scripts/test-integration-postgres.mjs` set `childClosed = true` for every `runCommand` rejection. On Node `v24.13.0`, `execFile` can invoke its callback from the child `error` handler before the `close` event; therefore callback delivery alone did not prove process closure.

The correction changes only three harness files plus this report:

- `tests/recovery/postgres-runtime.mjs` now settles a command only after an observed `close`, or after a separate bounded one-second closure-evidence window. Results carry `childClosed: true`; errors carry the actual observed boolean. If closure is not observed, the original command code/reason remains in the error and incomplete diagnostics are omitted.
- `scripts/test-integration-postgres.mjs` derives cleanup permission from that explicit result/error field. It no longer treats every callback rejection as closure. Existing `failure ??= cleanupError` preserves the original command failure, while `cleanupTask` retains the run root when `childClosed` is false.
- `tests/recovery/postgres-runtime.test.mjs` adds the real-child early-error regression.

TDD and verification from `owner-platform`:

1. RED — `node node_modules/vitest/vitest.mjs run tests/recovery/postgres-runtime.test.mjs --config vitest.recovery.config.ts`: exit `1`; 1 expected failure and 11 passes because the real-child observation hook/closure evidence did not exist.
2. GREEN — same command: exit `0`; 12/12. The test starts a real Node child, makes timeout termination emit `EPERM` without killing it, observes callback rejection while `exitCode` is still null and no `close` occurred, verifies `childClosed: false`, the retained `EPERM` reason and omitted partial secret prefix, then closes only that test PID and awaits its real `close`.
3. `$env:OWNER_POSTGRES_BIN='...\pgsql\bin'; npm run test:integration:postgres`: exit `0`; unchanged PostgreSQL editorial suite 22/22, Vitest `24.38s` (tests `17.46s`), zero sessions after actual child close, exact server shutdown and run-root removal.
4. `$env:OWNER_POSTGRES_BIN='...\pgsql\bin'; npm run test:recovery:postgres`: exit `0`; helpers 27/27, then native recovery passed with 5 backup files, 4 media files, 2 page versions, corrupt/missing rejection, closed sessions, exact shutdown and cleanup.
5. `npm run lint` and `npm run typecheck`: both exit `0`.

SQLite code and orchestration were not changed in this correction, so its previously recorded 22/22 editorial and physical-recovery results were not rerun. No timeout for Vitest, PostgreSQL, or recovery work was increased; the new one-second bound applies only after an already-delivered callback while awaiting independent closure evidence.

## Independent final controller evidence

- Before the fix, the controller repeated the frozen implementation (22/22, 27.73s) and then committed `9e4a33a` (22/22, 31.12s), plus 26 helpers, full lint and typecheck; all exited 0. This verified normal operation but did not cover the later-reviewed early-error path.
- Final committed `b3ef499`: `npm run test:integration:postgres` with the portable binary path above exited 0. Vitest: 1 file, 22/22 cases, 26.77s. All six tools reported PostgreSQL 17.11. The runner observed the test process close, zero other database sessions, exact cluster shutdown and removal of only its synthetic run root.
- On the same commit, `node node_modules/vitest/vitest.mjs run --config vitest.recovery.config.ts` exited 0: 4 files, 27/27 helpers, 9.57s, including the new early-error regression. Final lint/typecheck and the native PostgreSQL physical regression are implementer evidence above, not falsely attributed to a second controller run after the fix.
- Independent read-only delta review approved the P2 correction, with no new Critical/Important/Minor findings. The reviewer did not rerun suites; controller test evidence is separate. Public commits `e04487b`, `1abb270` and `a86b40b` were excluded from these owner reviews.
- Final Git inspection: implementation paths clean, index empty, checkpoint still `0f0adf686b2752e23c25d224f8c60815b10fd451`; no PostgreSQL process observed after completion. Unrelated coordination/private/untracked files were preserved.

The expected no-email-adapter warning remains visible. No actual email, Figma/AI provider, browser UX, public build/deployment, production schema migration or external storage was validated in this increment. [Media operational gaps](media-operational-gaps-2026-09-07.md) records the next file-persistence gate and the still-unpublished CV.
