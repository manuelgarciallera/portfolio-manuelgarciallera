# Recovery HTTP admission — local verification

Base `3e33dc9`; integration reservation sent to Claude as
`dc3dc2b3-9097-405d-ad5d-eb5bd2eab4eb`. Supersedes the earlier candidate-only status
of the admission core and schema documents. No deployment or public push.

## What changed

The PostgreSQL owner configuration selects `recoveryPostgresAdapter`. Its REST
forgot-password handler validates and normalizes the address, then commits shared
admission before generating a token or invoking the email provider. It verifies
bounded pool acquisition, uses the configured schema and never provisions tables
on a request. Storage/configuration failures return the same no-store 503 for any
address, without consulting whether the account exists.

Limited, unknown-account and accepted requests retain the existing neutral 200
receipt. Rejection leaves the previous token, hash, sessions and login lock state
unchanged. A failed provider delivery rolls back native token changes but cannot
refund the independently committed admission budget. Logs contain a fixed event,
not SQL errors, addresses or provider credentials.

SQLite retains local development behavior only. The trusted server-side Payload
local API is outside this REST limit; it must not be exposed through a bypassing
endpoint. Arbitrary forwarding/IP headers do not influence admission. No claim
of timing uniformity, distributed SQLite support or edge DDoS protection.

Production/recovery QA now selects the additive catalog. Legacy local-media QA
selects baseline plus the independent admission delta; object mode includes all
three migrations. The full recovery fixture seeds actual global/recipient rows
and compares their physical restoration alongside its content/version receipts.

## Verification

- RED HTTP `f98f86`: two consecutive requests emitted two provider calls/emails.
  This was a behavioral failure, not a missing module or unavailable database.
- GREEN PostgreSQL HTTP `ddee7b`: 14 native/auth admission cases pass, including
  non-refund after provider failure, previous-link preservation, missing-table
  fail-closed behavior, normalized keys and spoofed-header independence.
- Complete PostgreSQL integration sweep `d19a35` / cleanup receipt `07b7b4`:
  **88 tests / 12 files passed**, exit 0, including editorial workflows, media,
  legacy schema catalogs, the new migration and authentication. SQLite native
  recovery `fd4d9b`: seven passed and seven PostgreSQL-only cases explicitly
  skipped; not presented as distributed SQLite verification.
- Existing supersession and outage tests age only synthetic persisted cooldown
  timestamps to exercise a later allowed request. The real database clock and
  limits remain active. Before each case, only the isolated fixture's admission
  table is truncated; no application data or real account is involved.
- All owner unit tests `21ed2e`: **1,286 / 169 files**, exit 0. Strict typecheck,
  focused lint and diffcheck `7da03d` pass. Public boundary guards `53dbda`:
  **14/14**, no new public runtime/dependency or style changes.
- Full physical recovery `839315`, PostgreSQL 16.15 / Node 24.18: native dump and
  restore, three migration rows, persisted admission rows, 18 backup files,
  12 media files, three revisions and three page versions. Login, restored
  workflow execution, independent edits, frozen preview and snapshot-only media
  retention pass; 12 damaged-backup cases rejected before allocation. Processes
  and sessions closed and only the synthetic run root was removed.
- Production build and browser `dbdcbb`: native editor at **390 and 1280 px**,
  keyboard login, create/edit/reorder/save/reload/preview; four drafts and two
  brands survive application restart; private object uploads/replacement and
  anonymous denial pass. This is an isolated production build, not a deployment
  or physical-phone test.
- Independent read-only reviewer found no important defect in runtime or fixture
  changes. They did not execute tests; the receipts above are the main agent's.
  No acceptance by Claude is inferred from a sent message.

## Provenance and remaining scope

The isolated checkout's Git HEAD is `a98b80d`, with current source/QA overlays.
Its recovery receipt's `applicationCommit` is that checkout base, **not** the SHA
of this newer uncommitted integration. SHA-256 comparisons (`e415e7`, `d7afe0`)
matched host and container for all eight relevant runtime/fixture files before
closing this gate. Do not use the old printed SHA as evidence of a clean build of
a newer commit. The fresh-checkout rehearsal below supersedes that provenance
limitation for its explicitly listed checks, not for unlisted tests.

## Fresh-checkout rehearsal after commit

Exact source: `8bd695ee2a75e9bf32c8171f0f9fb1f8d9c4f930`, cloned from the verified
local `.audit/recovery-8bd695e.bundle` into a new isolated directory. Bundle SHA-256:
`DFE527428591187754A48900CF0749FB4052A471772953E4FD9203FE343EF38D`.
Git status was empty before testing (`f0c7e9`) and after the build/browser run
(`2e38de`). Installed dependencies were copied from the previous test workspace;
package manifests/lockfiles have no delta between those commits. This proves
clean source checkout execution, not a fresh dependency download.

- Full PostgreSQL/object recovery (`d1684a`, exit 0) reports that exact
  `applicationCommit`; 45 recovery unit tests also pass. Native dump/restore,
  18 backup files, 12 media files, three revisions/page versions, admission
  counters, migration ledger, recovered login, workflow and subsequent edit
  pass. Twelve damaged-backup cases are rejected before allocation. Cleanup
  confirms shutdown and removal of only the synthetic run root.
- Production build and browser (`e92781`, exit 0): native create/edit/reorder/
  save/reload/preview at 390 and 1280 px; a second page with a distinct brand
  does not modify the first. Four drafts and two brands survive process restart.
  Object upload/replacement/private bytes and anonymous denial pass. Owned app
  and database processes close successfully. `deployment:false` remains explicit.
- Full integration rerun on the same checkout (`44b4ea`): 88 tests / 12 files
  pass, 139.81 seconds. The PostgreSQL runner includes fixtures deliberately
  pinned to SQLite; this is the complete integration gate, not a claim that
  every individual test uses PostgreSQL. Git integrity check `eec336` exits 0.

Actual provider delivery, real hosted database/object durability, trusted edge
traffic limits, timing enumeration mitigation and deployment review remain open.
No public site, DNS, email account, antivirus setting, paid service or real
customer data was changed. The previous checkpoint remains protected.
