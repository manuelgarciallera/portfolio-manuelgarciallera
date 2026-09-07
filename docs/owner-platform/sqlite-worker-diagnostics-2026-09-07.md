# SQLite editorial worker investigation

## Scope and status

The CMS local SQLite editorial suite intermittently ended with Vitest's
`Worker exited unexpectedly`, after 7 or 18 of 22 cases, without an assertion
failure. PostgreSQL passed all 22 cases in the preceding increment, `89fec79`.
This is an open reliability investigation, **not a fixed defect or a release gate
waiver**. No adapter, transactions, dependencies, public UI or real data changed.

Installed environment: Windows, Node 24.13.0, Vitest 4.1.10,
`@payloadcms/db-sqlite` 3.88.0, `@libsql/client` 0.14.0 and `libsql` 0.4.7.
These are observations of the local lock/install, not recommendations to upgrade.

## Missing evidence

The installed Vitest fork-pool `emitUnexpectedExit` discards the child exit
arguments and reports only a generic error. Its normal stop path calls
`fork.kill()` after the suite. Therefore a SIGTERM **after a passing summary**
does not reproduce the unexpected exit. The failing worker's actual code/signal
is still needed before attributing this to native SQLite, Vitest, resources, or
application code.

## Opt-in diagnostic

`owner-platform/tests/diagnostics/process-events.mjs` observes process exit,
beforeExit, uncaught-exception occurrence and fork exit code/signal. It writes
only event names, PIDs, codes and signals. It deliberately omits environment,
arguments, exception contents, URLs, CMS documents and credentials. It neither
retries nor changes exit codes nor keeps an event loop alive. It is never imported
by the application or enabled in the regular test runner.

From `owner-platform`, use a **temporary shell session**:

```powershell
node --test tests/diagnostics/process-events.test.mjs
$env:NODE_OPTIONS='--import=file:///C:/Develop/portfolio-manuelgarciallera/owner-platform/tests/diagnostics/process-events.mjs'
node scripts/test-integration.mjs
```

Close that shell after the experiment; do not persist NODE_OPTIONS globally.
Adapt the file URL if the checkout moves. Ordinary application/Vitest logs are
not redacted by this helper: run it only on the existing synthetic fixture,
not against a real owner database, and review logs before sharing.

The integration runner still creates and cleans its own isolated temporary root.
The preload observes forks, not arbitrary spawned processes or worker threads.
Native or forcibly terminated processes may not emit their own JavaScript exit
event; the parent fork observation can still record their termination. This
instrumentation can affect timing, so successful instrumented runs cannot prove
that the original race/crash is gone.

## Verification so far

- Six helper tests exercise real processes: normal exit, explicit nonzero exit,
  uncaught exception, closed stderr, a fork's nonzero exit and signal termination.
  All pass; synthetic environment, argument and exception markers are absent from
  observer records. Native stderr still prints the synthetic exception normally.
- Sequential instrumented SQLite run 1: 22/22, 54.54 s, exit 0. Worker SIGTERM
  occurred after the passing summary; parent exited 0.
- Sequential instrumented SQLite run 2: 22/22, 42.19 s, exit 0, same normal stop.
- Sequential instrumented SQLite run 3: 22/22, 32.48 s, exit 0, same normal stop.
- The independent reviewer found no blocking issue in the helper and reviewed
  the final edge-case additions. Controller verification: all six helper tests
  and targeted ESLint pass, exit 0. No application runtime was modified.

## Public lane coordination

Claude's `9baff85` only updates two obsolete source-level frame assertions; the
public runtime was unchanged by that commit. Controller public unit run:
209/209, 32 files, 8.19 s, exit 0. The broader `check:all` is a separate command
and does not include that suite; its final result must be recorded separately.
Static responsive guards are not a replacement for a browser usability audit.

Final `check:all` on `9baff85`: exit 0. Thirteen public guard tests, 21-entry
dependency boundary, encoding/hero checks, eight structural responsive profiles,
mobile-navigation structure, lint and types pass. Build generated 28/28 pages;
bundle budget passed for ten routes without widening the baseline; production
dependency audit reported zero vulnerabilities. No production deployment or
live email/DNS check was performed. The protected pre-editor checkpoint remains
`0f0adf686b2752e23c25d224f8c60815b10fd451`.

Next: capture an actual failing worker outcome, then reproduce the responsible
boundary and fix it under a failing regression test. Do not disable transactions,
change database engines, loosen tests, or add retries to manufacture a green gate.
Storage durability, historical binary retention and CV/PDF support remain separate
unfinished CMS work. The current CV remains unpublished.
