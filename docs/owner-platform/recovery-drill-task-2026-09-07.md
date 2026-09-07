# Recovery drill: approved operational milestone

Manuel approved continuing the existing CMS through isolated persistence, editing, backup/restore and preview validation before any public bridge. This task implements the local recovery proof first; PostgreSQL is unavailable on the host (Docker daemon stopped; psql/pg_dump absent). This is not production readiness or a migration.

## Global constraints

- Work only in owner-platform and its dedicated documentation. Public design, runtime, dependencies, domain, mail, data and checkpoint remain unchanged.
- No external services, credentials, provider provisioning, new dependencies or publication.
- Never read/copy the owner's real database or media library. Fixtures are synthetic and isolated under a newly created temporary directory.
- Restore only to a new directory; do not overwrite source, backup or existing data. Cleanup is limited to the task-created temporary root after all child processes exit.
- Do not certify PostgreSQL, object storage, access-controlled/encrypted production backups, whole-site rollback or public publishing based on SQLite tests.

## Task 1: executable physical recovery drill

Implement a repeatable `npm run test:recovery` in owner-platform using current Payload, SQLite, sharp and test dependencies. Prefer a dedicated runner and focused integration fixture rather than growing the existing large editorial integration suite. Read applicable AGENTS and installed dependency implementation/docs as needed.

The command must ignore ambient DATABASE_URL, PAYLOAD_SECRET and bootstrap/connector credentials, use generated synthetic owner credentials in memory only, and real disk media under the task's temp root. No network provider calls or email sends.

Run an isolated seed process with the existing collection configurations/access rules and only database/media locations overridden. Exercise: create owner/login, create a page draft and edit it (including block order/text and mobile/desktop media placement if practical using existing fields), upload a generated PNG with real derivatives, save a placement linking the image, verify anonymous cannot read the draft. Persist IDs needed for recovery in private test state without secrets in logs.

Close the process before copying the database and media. Create a matched backup in a distinct new location with a manifest of SHA-256 hashes, sizes and application commit; do not include secret configuration. Restore into a third new location from that backup. Verify hashes before restoring. Start a fresh Payload process against the restored database and restored media, with the same synthetic credential supplied privately, and verify login, saved draft fields/order, version history, media relationship, original and derivatives byte hashes, and anonymous draft access rejection.

Prove the restored instance is independent by changing restored draft content and verifying source/backup hashes stay unchanged. Include a negative corrupt/missing-file check that rejects invalid recovery input before starting the restored CMS. Avoid designing a general-purpose backup API/daemon/UI in this task. The proof is a test harness, not a live backup service.

If existing behavior fails, preserve a regression test and fix only within narrowly justified owner scope; escalate runtime architectural decisions to controller. Test first for new helper logic, characterize existing Payload behavior without fabricating an initial failure.

Record exact commands/results in docs/owner-platform/recovery-drill-report-2026-09-07.md (also serves implementer report), explain what future PostgreSQL/storage gates remain, and document CV support as pending: Media is currently image-only; no PDF upload/public link in this task.

## Verification / delivery

Run focused recovery command; unit tests for any new helper, owner lint/typecheck and diff check. Controller runs broader regressions/review. Commit only own task files (not shared REGISTRO/PROTOCOLO or untracked AGENTS). No push. Do not spawn agents. Return short status with commit, test counts, report path and limitations.

## Controller ledger

- Base: 5b9f783 (Claude's new identity-photo commit preserved).
- Ruling: stay in current non-main shared checkout under the existing owner/public lane agreement and user's instruction to advance without repeated questions. Do not switch branch or create a second dependency installation. Risk: concurrent edits require explicit reservation and scoped staging.
- Task 1 internal scan: seed/copy/restore consume the same synthetic fixture IDs and file manifest; all paths must stay in newly created root. No other implementation task shares files. Production readiness is expressly excluded.
- Task 1 implementation: `aa6867f`; implementer report: `bd18f16`.
- Concurrent Claude public commit `9dc0bb0` was preserved and excluded from the CMS review range. No push or deployment.
- Controller independent recovery execution on `aa6867f`: exit 0, helper 4/4, five matched files (SQLite + four PNG), two page versions, corrupt backup rejected and original/backup unchanged after restored edit. Zero SQLite sidecars observed in this run; do not generalize this to every shutdown.
- Baseline before implementation: 700 owner unit tests, 22 editorial SQLite integrations, 8 responsive dashboard combinations and 22 document-control browser scenarios passed. Browser component fixtures do not certify the whole live admin or external connectors. Public isolation 8/8 and boundary 21 entries passed before Claude's concurrent public change.
- Independent final review: P2 found (anonymous rejection accepted arbitrary errors); corrected in `b7d22a6` with NotFound/404 discrimination, three focused cases and a check of the restored update result. Delta review accepted, no remaining blocking findings. Remaining product gates are PostgreSQL and durable storage/restore, recovery of owner access, compatible security remediation and controlled publication. CV/PDF stays unpublished and image-only Media unchanged.
- Final controller execution on `b7d22a6`: exit 0, 7/7 helper tests; physical workflow still verifies five files, four media files, two versions and independent restored edit. Implementation milestone complete; production gates remain open.
- Public follow-up requested by Claude: `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts` on the concurrent public change gave 205 passed / 2 failed. Frame-background/padding expectations in `redesign-responsive.unit.test.ts` require Claude's resolution. Hub result `ad70f182-4bdc-41e1-976c-e3f1edcbad9c`; no public edits/build/push by controller.
