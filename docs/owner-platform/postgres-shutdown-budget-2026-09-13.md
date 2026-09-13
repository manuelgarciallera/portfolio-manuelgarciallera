# Bounded durable PostgreSQL test shutdown

Base: `8a3a495`. Scope: recovery/integration test lifecycle only, no CMS runtime,
dependency or public website change.

## Cause and change

The isolated candidate's 92 tests passed, but pg_ctl's 30-second shutdown budget
expired during a measured 40.037-second durable checkpoint (39.805 seconds sync).
Evidence is retained in `payload-389-rehearsal-2026-09-13.md`.

Changed only shutdown to `pg_ctl stop -m fast -w -t 60`, with a 75-second outer
subprocess limit. Startup remains unchanged. This accommodates the measured
checkpoint without disabling fsync or using immediate shutdown. Exact directory,
postmaster PID, final status, subprocess closure and cleanup guards remain.

## Verification

- Initial test invocation omitted the recovery config and discovered no tests
  (`cd206d`); not RED evidence.
- Correct RED run `b22bc0`: the lifecycle rejects a modeled 40-second native
  checkpoint with its original budget. Native execFile is the only substituted
  boundary; real lifecycle code, files and deletion are exercised. This is a
  command-budget regression, not a benchmark of real fsync duration.
- GREEN `30e8e3`: 14 lifecycle/helper tests pass, including retaining files when
  pg_ctl stop returns but status still reports running. ESLint exit 0 (`433125`).
- Complete recovery-helper suite: 47 tests / six files, exit 0 (`93bfec`).
- Full real PostgreSQL 16.15 candidate integration with patched helper:
  92 tests / 12 files pass, 108.68 seconds. Outer runner exit 0 (`0d468d`):
  test process and DB sessions closed, exact cluster stopped and its new synthetic
  root removed. The earlier failed run's root remains preserved, not deleted.

Candidate is archive source d5720ee plus the recorded dependency candidate and
this helper overlay; not a pristine checkout of the final commit. No physical
backup/restore claim is made from this integration run. That gate and authorized
visual checks remain before active dependency integration. No push/deployment.
