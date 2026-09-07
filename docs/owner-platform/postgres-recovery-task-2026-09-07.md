# PostgreSQL recovery: next approved operational gate

Continue the existing owner CMS plan's PostgreSQL/backup prerequisite after the verified SQLite physical recovery milestone. This is an isolated local test, not deployment or migration of real owner data.

## Global constraints

- Preserve public runtime/design/dependencies, checkpoint and Claude's concurrent public CSS. Work in owner-platform and dedicated documentation only; no push or deployment.
- No real databases, media, accounts, credentials, SMTP, Figma or remote services. No arbitrary DATABASE_URL support in this harness: create and address only this run's new loopback PostgreSQL cluster.
- No new npm dependencies. PostgreSQL tools are a development-only ignored cache from the official Windows download channel. Do not install a Windows service, edit PATH, reset Docker or bind outside 127.0.0.1.
- Generate synthetic credentials; never log secrets or persist them in the report/manifest/Git. Any temporary credential file must be within the new ignored test root and removed only after processes stop.
- Restore to a new database and new media directory, never overwrite originals. Cleanup only exact task-owned paths/processes after verified shutdown. Never delete reusable tool binaries or other test runs.
- Passing local PostgreSQL is not proof of production TLS, provider storage, encrypted/offsite backups, PITR, migration upgrades, tenant isolation or public publication.

## Task 1: executable local PostgreSQL recovery

Add `npm run test:recovery:postgres` using a supplied `OWNER_POSTGRES_BIN` directory of existing binaries (initdb, pg_ctl, psql/createdb, pg_dump, pg_restore). Missing tools must fail clearly before any data is created, not skip green. Controller is preparing EDB PostgreSQL 17.11 binaries at `owner-platform/node_modules/.cache/postgres-tools-17.11/unpacked/pgsql/bin`; use only when confirmed available. Do not download tools in the runner.

Reuse the existing seed/restore editorial fixture from `tests/recovery/payload-worker.mjs` and its safe helpers. Add the PostgreSQL adapter path without changing the default SQLite command, auth rules or content schema. Avoid duplicating the complete workflow; extract a small shared runner/helper when needed. PostgreSQL schema creation in this disposable test may use development push; explicitly document that reviewed production migrations are still required. Check installed adapter implementation/docs before API choices.

Create a fresh temporary root under ignored node_modules/.cache, initialize a new cluster with scram-sha-256 password authentication and a generated password, choose an unused loopback port, and start it without a global service. Use two new databases in that cluster (source and restored). Use only required temporary credentials in child env/stdin/file, not command output. Sanitise inherited PG*/DATABASE_URL/PAYLOAD_SECRET/bootstrap/connector options. Do not take an arbitrary existing connection string.

Exercise the real same owner login, page draft/edit/order, original+derivative image upload, media placement relationships and responsive crop, page versions and strict anonymous NotFound/404 denial. Once the source Payload process has closed, use native `pg_dump` custom format; pair dump and media bytes under the same manifest (extend the existing database/manifest layout rather than fake a PostgreSQL data-file copy). Verify the backup before creating restore outputs. `pg_restore --exit-on-error` (and transaction where suitable) targets only the newly created restore database. Start a fresh Payload process on that database/media and assert the same records, relationships, versions and hashes; edit restored draft and verify source content remains unchanged and backup hashes unchanged. A PostgreSQL source dump need not be byte-identical across independent dumps: verify logical source state, not nondeterministic archive bytes.

Preserve the corrupt/missing archive refusal before restore and the actual close-before-copy guarantees. Stop only this cluster with its exact data directory, wait for shutdown, then clean only the task root. Failures must keep the original error and explain retained synthetic temp data if shutdown could not be proved. Use timeouts on subprocesses, no unlimited waits or global process kills.

Use TDD for new command/path/env/lifecycle helper behavior. Existing Payload behavior can be characterized. Run new command against real tools, regression `test:recovery`, focused helper tests, owner lint/typecheck; full owner unit suite once if touched shared runtime. Do not fabricate coverage or count grouped assertions as independent tests.

Write full evidence and limitations to `docs/owner-platform/postgres-recovery-report-2026-09-07.md`, including exact binary version, commands, files, result and cleanup; mark unsupported gates honestly. Commit only your implementation/report files, not shared REGISTRO, this task brief, untracked AGENTS or Claude files. No agents; controller provides independent review.

## Controller ledger

- Previous goal turn: progress (SQLite recovery command, review correction and verified evidence committed). Goal remains active: production prerequisites and publication bridge still incomplete.
- Base: 173caa3. Public CSS dirty belongs to Claude; keep separate.
- Ruling: continue scoped owner work in the existing non-main checkout, preserving established lane and user's no-repeat-confirmations instruction. Risk if wrong: concurrent edits require explicit handoff, never silent overwrite.
- Ruling: use portable PostgreSQL 17.11 from EDB (official PostgreSQL Windows download link), not a Docker reset. No global installation, no cloud cost. The cache consumes local disk; it does not enter the public bundle.
- Scan: one implementation task; source schema/fixture and restored schema/fixture must match. Shared worker changes must preserve SQLite. No production migration or arbitrary database target. All test data stays isolated.
- Task 1: accepted locally. Implementation `d7fe885` and correction `4c2c32f` independently reviewed; final PostgreSQL and SQLite recovery both passed. The broader CMS goal remains active with production prerequisites open.

### Independent checks and review

- `d7fe885` follows Claude's public-only `a0c0a88` and documentation-only `00c908a`; the review package is `00c908a..d7fe885`, excluding both concurrent changes.
- Controller `test:recovery:postgres`: exit 0, PostgreSQL 17.11, five backup files (custom dump and four media), two restored versions, corrupt/missing archive rejection, source editorial state unchanged, source sessions closed before dump, exact shutdown and removal. Manifest records committed `d7fe88576c5f62facb7f293f5c9c890317da6814`.
- Controller SQLite regression: exit 0, same committed SHA, five backup files, four media and two versions. Helpers 16/16, lint and typecheck: exit 0. Public isolation 8/8 and boundary 21 entries: exit 0. No public build/deploy or production certification.
- Independent review P2: shared worker diagnostics were trimmed before redaction, so a secret crossing the buffer boundary could leave a visible suffix. Read-only synthetic reproduction confirmed it. `4c2c32f` corrects this by omitting incomplete/mixed diagnostics, with boundary/split-chunk tests; no real credential was used or observed. Delta review approved without remaining blockers.
- Final controller rerun: PostgreSQL and SQLite commands both exit 0; 24/24 helpers, full lint and typecheck pass. PostgreSQL manifest records `4c2c32f`; SQLite records concurrent public-only `80be2b8`, with an empty owner diff between them. See final report for exact evidence and remaining gates. No public build, push or deployment.
- Claude requested publication in Hub `43f0b0b2`; processed/acknowledged and answered in `5f99cd26`, without accepting deployment under this task's explicit no-deploy constraint. Windows public unit run on `a0c0a88` remains 205/207, two frame background/padding expectations failing; result sent in `35c8df91` for Claude's lane. Do not silently change his CSS/tests or claim `check:all` passed.
- Subsequent Claude request `79bccef7` for local Windows verification was processed/acknowledged. After milestone `e397e75`, controller `check:all` genuinely passed (including public build and audit); separate public unit rerun remained 205/207 on the same HEAD. Result `b11306e3` explicitly distinguishes these outcomes. No public source fix, push or deployment; prior "no public build" entries describe the recovery-only checkpoint before this follow-up.

## Local tooling evidence (controller)

- Docker Desktop startup failed in its Inference manager while opening its local socket. No factory reset, socket deletion, Docker data removal or configuration change was attempted. Only the six processes attributable to this controller's failed startup were stopped after checking their names and start times; no pre-existing Docker processes were targeted.
- Portable tools were obtained through the [official PostgreSQL Windows page](https://www.postgresql.org/download/windows/) and its [EDB binaries link](https://www.enterprisedb.com/download-postgresql-binaries). The download resolved to `https://get.enterprisedb.com/postgresql/postgresql-17.11-3-windows-x64-binaries.zip`.
- Archive size: 341325378 bytes. Locally measured SHA-256: `4B8DB0930C38F6EF845DB919551DEDDA3B6B845AEB0927B3D79A6E8E9E4537CF`. The archive is downloaded over the vendor's HTTPS channel, but this locally calculated digest is not an independently verified vendor signature.
- Extraction completed with exit 0 in ignored `owner-platform/node_modules/.cache/postgres-tools-17.11`. `postgres`, `pg_dump`, `initdb`, `pg_ctl` and `pg_restore` report version 17.11, and `share/postgres.bki` exists. No installer, Windows service, global PATH change or npm dependency was added. The full portable archive/extraction consumes local disk space only; additional bundled applications were not launched.
- Hub reservation `ec33fe31-885b-4a3f-8d0c-56ba52d03b4f` sent to Claude. No response in this topic at the controller's latest check; that is not acceptance or guaranteed continuous coordination.
