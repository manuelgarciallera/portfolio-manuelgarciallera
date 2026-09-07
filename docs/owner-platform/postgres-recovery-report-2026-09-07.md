# Local PostgreSQL recovery evidence — 2026-09-07

Status: implemented and locally verified; two native PostgreSQL runs and two SQLite regression runs passed. Controller review and a repeat against committed code remain separate. This extends the completed SQLite recovery milestone; it is not deployment or a migration of owner data.

## Scope and implementation

- `owner-platform/scripts/test-recovery-postgres.mjs`: `npm run test:recovery:postgres` initializes a fresh, synthetic PostgreSQL cluster under ignored `node_modules/.cache/owner-postgres-recovery-*`. It never accepts an existing `DATABASE_URL` and does not download tools, install services, modify PATH, or connect to remote resources.
- `owner-platform/tests/recovery/postgres-runtime.mjs` and its tests: binary preflight, allowlisted environment, bounded subprocesses with redacted diagnostics, fixed loopback endpoints/database names, exact run-root validation and conservative cleanup.
- `owner-platform/tests/recovery/worker-runner.mjs` and its tests: shared actual-process-close gating and failure propagation, extracted from the existing SQLite runner. A successful IPC result cannot mask a nonzero process exit.
- `owner-platform/tests/recovery/payload-worker.mjs`: same application collections, permissions and synthetic editorial fixture, with the installed PostgreSQL adapter selected for the new runner. Restore/source verification additionally compares version IDs, titles and layouts. No content schema, auth rule, public runtime, dependency or lockfile changes.
- `owner-platform/scripts/test-recovery.mjs` retains SQLite as the default recovery command and uses the shared worker launcher. The existing generic manifest helpers are reused unchanged.
- `owner-platform/package.json` adds only the PostgreSQL test command. This report is the implementation evidence; the controller owns the shared coordination ledger.

## Native tool provenance and reproduction

Controller-supplied portable EDB Windows PostgreSQL 17.11 archive, obtained through the official PostgreSQL Windows download channel. Controller reported archive size 341,325,378 bytes and SHA-256 `4B8DB0930C38F6EF845DB919551DEDDA3B6B845AEB0927B3D79A6E8E9E4537CF`. This implementation did not download or independently authenticate that archive. All six executables were actually invoked with `--version`, each reporting **PostgreSQL 17.11**: initdb, pg_ctl, psql, createdb, pg_dump and pg_restore.

Run in PowerShell from `C:\Develop\portfolio-manuelgarciallera\owner-platform`:

```powershell
$env:OWNER_POSTGRES_BIN = 'C:/Develop/portfolio-manuelgarciallera/owner-platform/node_modules/.cache/postgres-tools-17.11/unpacked/pgsql/bin'
npm run test:recovery:postgres
npm run test:recovery
node node_modules/vitest/vitest.mjs run --config vitest.recovery.config.ts
npm test
npm run lint
npm run typecheck
```

Windows, Node.js 24.13.0; installed Payload and PostgreSQL adapter 3.88.0. Reviewed adapter README, `dist/connect.js`, `dist/index.js`, Payload `destroy` and drizzle `destroy` before selecting APIs. Next's installed serverExternalPackages guide was also read; no Next configuration change was necessary.

## What the test proves

The harness generates credentials, binds only `127.0.0.1` on an unused port, initializes host/local authentication as SCRAM-SHA-256, and verifies the generated role's password uses SCRAM. The interval between probing and binding the port is a potential race; a collision fails startup rather than reusing another server. Inherited PG variables, database URL, Payload/bootstrap/connector and Node injection options do not reach native tools or the Payload child. The password reaches native tools only through the child environment and the initial temporary password file, and reaches Payload through IPC. Secrets are excluded from the manifest, console diagnostics and this report.

The source worker performs real owner creation/login, draft creation/edit/block reordering, upload of a generated original image and three derivatives, media/placement relationships and desktop/mobile/tablet crop values, two saved page versions, and the existing strict anonymous NotFound/404 check. This is the Payload Local API with access enabled, not browser or HTTP-route coverage.

Only after the source process closes and `pg_stat_activity` confirms zero remaining source connections does native `pg_dump --format=custom` create `database/owner.dump`. Its `PGDMP` signature is checked. The existing SHA-256 manifest pairs that archive with `media/*` bytes under `backup/data`; it does not pretend that live PostgreSQL data files are a portable backup. Every listed file, size and hash is verified. The manifest's `applicationCommit` identifies current Git HEAD, not uncommitted source contents.

Two damaged copies of the real archive (corrupt and missing) must fail integrity checks with no restore directory and no restore database. The valid archive also passes `pg_restore --list`. Only then are new media output and `owner_restored` database created. `pg_restore --exit-on-error --single-transaction` targets this new database. A fresh Payload process verifies records, relationships, responsive placement, version history and all four media hashes, then edits the restored draft. A third process reopens `owner_source` and verifies its original editorial state. Source media and backup bytes remain unchanged. Authentication may add source session metadata; source isolation means editorial content/history/media, not byte-identical whole-database state or independently generated dump archives.

The installed adapter creates the disposable source schema with development push; restore/source-check reopen with push disabled. This is not a reviewed production migration. Installed drizzle `destroy()` clears schema state but does not close PostgreSQL's pool. After awaiting Payload destruction and flushing the result over IPC, the disposable PostgreSQL worker exits to release all its OS sockets; the controller waits for actual process close and checks server sessions. SQLite retains its prior explicit client close.

## Verification results

- First native PostgreSQL run: **exit 0**, PostgreSQL 17.11; **5 backed-up files**, **4 media files verified**, **2 restored page versions**; native restore, corrupt/missing refusal, source editorial isolation, backup immutability and shutdown/cleanup passed.
- First run's Git HEAD was `a0c0a88a3915271debf771a88cae53a1eac238b6`; owner changes were uncommitted. Original assigned owner base was `173caa3`; intervening `a0c0a88` is Claude's public CSS commit and contains no owner changes. Public CSS is excluded from this implementation.
- TDD: six new boundary tests were executed first and failed on missing helper behavior; the implementation then passed all six. A seventh test then demonstrated that the command builder could target the source database for restore; the added guard makes that test pass and permits only `owner_restored`. Two real subprocess tests characterize the extracted worker close/failure guarantees. The existing seven backup/anonymous tests remain included. No grouped editorial assertions are counted as independent unit tests.
- Initial missing-`OWNER_POSTGRES_BIN` command: **exit 1**, explicit setup error before creating run data (not a green skip).
- Second native PostgreSQL run: **exit 0**, same 17.11 / 5 files / 4 media / 2 versions results, including the strengthened comparison of version IDs, titles and layouts. It recorded HEAD `00c908a54ca3b9610acc0a82fff43a75c222ba80`, Claude's intervening documentation commit; owner changes were still uncommitted. The final source-target rejection guard was added afterward and verified by its focused negative test; the controller will repeat the native run against the implementation commit.
- SQLite physical recovery: **two runs exit 0**, including the final shared version-history checks; **5 backup files**, **4 media files**, **2 versions**, **0 database sidecars** in these cleanly closed fixtures.
- Focused helper suite after the last guard: **16/16 passed**, four files, exit 0. Full owner unit suite run once: **700/700 passed**, 141 files, exit 0 (103.81 seconds).
- Full owner lint and typecheck: **exit 0**. An initial unused-import warning was removed before the successful final full lint. The last two helper files also received a focused lint pass after the source-target guard.
- Git's transient `index.lock` initially prevented staging; it was not deleted or forced. Controller confirmed it disappeared after concurrent Claude work. Staging/commit is restricted to the implementation/report files and excludes the shared ledger, task brief, generated untracked AGENTS/CLAUDE files and public files.

## Cleanup and limitations

Both PostgreSQL run roots (first: `owner-postgres-recovery-qXT1Io`) were removed only after `pg_ctl stop -D <exact cluster> -m fast -w`, status confirmed stopped, and `postmaster.pid` was absent. A read-only check afterward found no `owner-postgres-recovery-*` directories and no initdb/pg_ctl/postgres processes. The reusable tool cache was preserved. No normal owner database/media, other run root, Docker data or public file was deleted. All credentials and synthetic data from these runs were removed with their isolated roots.

Commands and workers have bounded timeouts. Cleanup verifies the exact immediate child run directory and rejects symlinked roots. If initialization is interrupted or startup/shutdown cannot be proved, it preserves the synthetic run root and reports its path; cleanup errors do not replace the original workflow error. It never issues global process kills.

Remaining unsupported gates: production TLS/provider connectivity, managed service configuration, durable object storage, encryption/offsite retention, PITR/WAL archiving, restore-time objectives under realistic volume, migration upgrades, tenant isolation, SMTP, deployment, public publication bridge and production readiness. A successful isolated local restore does not close those gates.

Next responsible: controller, independent review and repeat against the implementation commit, then update the shared ledger/Hub. No push or deployment by this implementation task.
