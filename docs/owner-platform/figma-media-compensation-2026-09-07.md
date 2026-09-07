# Figma import: bounded local-file compensation

Date: 2026-09-07. Owner implementation, no deployment or real-provider connection.

Status: narrow correction implemented and independently reviewed; final PostgreSQL, unit, lint, type and build checks pass. SQLite's intermittent process-exit gate remains open. This is a recoverable development increment, not a production release.

## Scope and reproduced defect

The editorial fixture now writes actual originals and derivatives inside its validated disposable run directory. It does not touch the owner's library. With only the new manifest assertion added, the SQLite Figma audit-failure test failed: rows and versions rolled back, but `qa-hero.png` and `qa-hero-32x32.png` remained (147 bytes each).

Installed Payload 3.88 writes files before inserting the media record. Its nested catches call `killTransaction`, which suppresses rollback errors and removes the request's transaction ID. The Drizzle adapter also masks some transaction failures. A returned rollback helper is not proof that it is safe to delete arbitrary files.

## Implemented correction

- Each Figma attempt uses an unpredictable UUID filename prefix.
- A receipt is retained only after media creation returns successfully, containing original and explicitly returned derivative names.
- On a later failure, compensation is permitted only before any commit attempt and after the rollback call returns. Fresh database reads omit the failed request, transaction, context and loader; they check media including trash and version references.
- The initialized local storage directory and every receipt filename must validate. Linked roots/files, paths outside the namespace, unsupported storage or inconclusive queries retain files. There is no directory diff, wildcard or recursive runtime deletion.
- Removal is limited to exact regular files from the receipt. Reporting preserves the original import error. Incomplete removal is reported separately, including its completed removal count.
- Uncertain commit, explicit rollback failure or media creation failing before returning a receipt retain bytes for reconciliation. Diagnostic metadata identifies the attempt/review without credentials or image contents.

The current configuration uses a single primary database. If replicas are introduced, the reference checks must be explicitly pinned to the primary before this cleanup remains enabled. UUID namespaces are practical collision avoidance, not exclusive filesystem ownership or protection against an external actor replacing directories concurrently.

## Verification ledger

- TDD: real SQLite manifest assertion RED, then focused Figma integration GREEN. Original audit error preserved.
- Real PostgreSQL 17.11 editorial suite: 22/22, exit 0, 30.43 s. Physical original/derivative inventory, prior same-name image bytes, row/version rollback and successful retry verified; isolated process/sessions/cluster closure and exact-root cleanup confirmed.
- Focused unit tests: 23/23 before diagnostic metadata extension. Real temporary files cover receipt deletion, deduplication, unrelated bytes, linked root, malformed filename, directory disguised as a derivative, existing database/history references and unsupported storage. Service tests cover commit/rollback/upload uncertainty and failed logging.
- Full owner unit suite before diagnostic metadata extension: 716/716, 142 files, exit 0, 80.14 s. Final source: 717/717, 142 files, exit 0, 79.02 s. Additional TDD cases reproduced a logger masking the original error, missing attempt identifiers, and an unnecessary reconciliation warning when a duplicate race stopped before upload; all corrected.
- SQLite full suite: two failures from unexpected worker exits after seven completed tests, not failed assertions. The isolated crop case and Figma case each pass. A sequential verbose run without another heavy test process passed 22/22, exit 0, 32.28 s. A final default-reporter run failed again after 18/22 (28.06 s), stopping its chained checks. The cause remains undetermined; these failures are not counted as success, and a reliable all-green SQLite gate is still open. Earlier reports record the same worker-exit category before this increment; that does not establish an identical root cause.
- Final source repetition, separate from the failed SQLite chain: PostgreSQL 22/22 (30.58 s), confirmed worker/session/cluster closure and synthetic cleanup, followed by complete lint, typecheck and owner production build (23/23 static outputs), all exit 0. No source changes after those checks.
- Public boundary 21/21 entries and isolation 8/8 passed after this implementation; package manifests/locks and public sources remain unchanged by this task.

Independent source review, including the final diagnostic delta, found no must-fix within the declared completed-upload/precommit scope. It did not rerun the parent tests. It explicitly retained the limitations below and recommended stronger OS partial-removal fault injection as a nonblocking improvement.

## Remaining gates — not solved by this increment

1. A failure *inside* Payload media creation may happen after some files are written and before a receipt returns. `Promise.all` can allow another write to finish after rejection. The partial-upload unit test substitutes that boundary and writes a real temporary file; it does not reproduce every internal Payload write failure. General cleanup needs an exclusively owned staging writer/journal and settlement of all writes, not guessed derivative names.
2. Process crashes and uncertain commits need durable reconciliation and explicit durable-outcome verification, especially given the installed adapter's error masking. Files are deliberately retained rather than risking deletion of committed content. No reconciliation dashboard or durable attempt journal is claimed here.
3. Historical byte retention after replacement/deletion, HTTP access to draft binaries, provider persistence, staging/migrations and account recovery remain separate release gates.
4. No PDF/CV/font support or document publication was added. No claim that this CMS is production-ready or a completed multi-tenant product.

## Parallel public lane verification

Claude's public close `525cac4` was checked read-only: `check:all` exit 0 (13 guards, 21 entry boundary, 8 structural responsive profiles, lint/types, build 28/28, budget 10 routes, public security audit 0 vulnerabilities). `/sobre-mi`: baseline 150495 raw / 48343 gzip bytes; current 150509 / 48315, delta +14 / -28. No baseline increase.

Separate public unit command `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts`: 207/209, two existing frame background/padding expectations fail in `redesign-responsive.unit.test.ts`. Claude notified via `84b7c462`; no public source or tests changed by this task. Build success is not a claim that all public tests pass. No push, promotion, email or DNS action.
