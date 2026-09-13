# Verified transaction outcomes — local regression verified

Base52642c1, owner only. Reservation3c942045 and proposal5e6a14fa sent through
the Hub; independent acceptance is not inferred. No deployment/schema/public edit.

## Reproduced failure

The installed Drizzle adapter catches the transaction's final rejection while
attempting to notify its already-resolved opening promise. Its commit helper
also absorbs completion errors. Our service therefore cannot infer commit
success merely because Payload's commit utility resolved.

The new PostgreSQL integration case installs a deferred constraint trigger only
in its disposable database. Inserts and application hooks finish, but COMMIT is
rejected by PostgreSQL. RED4a9e33 confirms no release or audit was persisted,
yet createOwnerRelease returned an apparent successful record (id5). This is
not an assertion about production data loss or the separate Windows native crash.

## Change

`src/database/verified-transactions.ts` wraps only our trusted adapter factories.
It preserves Payload's transaction ID/session structure, waits for initialization
and transaction opening, and retains the original database completion promise.
Opening errors reject the opening wait. Commit errors reach callers. Intentional
rollback is distinguished by a private sentinel from a database rollback failure.
Sessions are removed before finalization, preserving the existing no-double-end
contract. PostgreSQL's explicitly disabled transaction option stays disabled.

Both owner SQLite and recovery PostgreSQL factories use this wrapper. The
editorial integration fixture now uses that actual PostgreSQL factory rather
than the bare upstream adapter. No node_modules patch, retry, provider, database
schema migration or authorization relaxation is involved. Unknown commit outcomes
remain errors, never a claim that a rollback definitely happened.

## Evidence so far

- Five deterministic boundary tests cover commit success/failure, opening failure,
  rollback success/failure. Missing-module RED5c5df1;5/5 pass29d10b.
- The actual PostgreSQL editorial suite including deferred-COMMIT rejection
  passes38/38 (74afce),17.68s; runner verifies session/cluster cleanup.
- Full owner units1310/171 pass (d3b109),75.65s, plus3 script tests (3b8dba).
- Typecheck passes756c65. Initial focused lint had two unused fixture arguments;
  they were corrected explicitly, not disabled. Full lint/integrations pending.

Full integration subsequently passes93/93 PostgreSQL cases (4ace63),162.61s;
runner cleanup/session closure passes173885. Windows SQLite passes69 with24
PostgreSQL-only cases skipped (8ccb69),162.40s. This does not prove the separate
intermittent native crash has been fixed.

Independent read-only review by review_verified_transactions found no Critical
or Important issues. Suggested additional initialization/options/concurrent-session
coverage is recorded as a minor follow-up, not an independent test execution.

The full lint gate exposed a separate build-order defect (2fbbab): after preparing
local Monaco assets, ESLint scanned its copied/minified vendor distribution.
Added a functional ESLint regression (RED3914e4, GREEN6211a4) proving that ONLY
the copied `public/vendor/monaco` subtree is ignored and malformed authored
source/public/scripts still produce parser errors. No rule was disabled globally.
Full `npm run lint` then passes (b58efb). Existing loader/worker/license byte
verification remains in place.

Current Windows build passes23/23 pages (d008a2), using the documented process-only
NODE_USE_SYSTEM_CA invocation; no TLS verification or machine setting changed.
Full native PostgreSQL recovery with object media passes (84822e),47 helpers,
18 backup files/12 media/3 revisions,12 damaged inputs rejected before allocation;
login/history/frozen-preview/restored page and article editing verified. Cleanup
confirmed. Container Git still identifies the earlier base0b0c308; source overlays,
not that SHA alone, identify this tested implementation. Public protections pass
22/22 and21 entries (61dd12). No root runtime/public source changed.

These gates verify this local correction, not production readiness of the CMS.
Native Windows intermittency, dependency cutover, real infrastructure and operator
recovery are separate open gates; this fix does not close those by implication.
