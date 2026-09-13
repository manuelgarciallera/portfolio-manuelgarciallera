# Isolated Payload 3.89 rehearsal — not integrated

Source `d5720eebe06a38803c5d5bbb534e100accfae67a`, 13 September 2026.
Archive `.audit/owner-upgrade-d5720ee.tar`, SHA-256
`D49DA46078393D8AEF50FAEE921902AE6D0C2F8D0A5CFA7A6261E792A19C36B1`.
Uncommitted browser-test and shared-document changes deliberately excluded.

## Attempts and evidence

- Extracted tracked source into `/tmp/owner-payload389-D25sDX` in the existing
  local Docker container. Copied dependencies normally, not via hardlinks, from
  the previous QA checkout. Baseline installation remains untouched.
- `npm install --save-exact --ignore-scripts` for the six direct Payload packages
  at 3.89.0 stalled on Docker DNS: npm log recorded repeated `EAI_AGAIN` for the
  public npm registry (`1ae262`). Confirmed own npm PID 1919 and terminated only
  that process. Command handle closed with exit 1 (`e43f0e`); candidate package
  still reports Payload 3.88.0 (`669d7a`). No DNS, TLS or antivirus changes.
- Windows registry metadata was reachable. Created separate
  `.audit/owner-payload389-windows` with copies of the owner package and lockfile.
  Package-lock-only resolution of the same six pinned updates failed ERESOLVE
  on old/new Payload peer dependencies (`d65cd8`). Did not use --force or
  --legacy-peer-deps, and did not execute install scripts.

These are environment/dependency-resolution results, not a failed application
test of Payload 3.89. No 3.89 runtime has been verified. The active owner package
and lockfile remain unchanged, and the public app was not touched or deployed.

Next: inspect the resolver's complete dependency conflict and compare a coherent
candidate lock without weakening peer validation. Retain old lock for comparison;
then obtain dependencies through the working registry path and run auth/media,
unit, integration, physical recovery and build gates in isolation. Browser
acceptance still needs the previously requested authorization. The advisory
interpretation from `payload-389-security-review-2026-09-13.md` remains in force:
an audit suggestion is not evidence of a security fix.

## Windows candidate resolved and tested

Aligning the six direct package versions while retaining the old lock still
failed ERESOLVE (`0f6554`). Preserved that lock as
`.audit/owner-payload389-windows/package-lock.baseline-388.json` and resolved a
fresh candidate lock with peer validation intact (`a39d0e`, exit 0). No --force
or --legacy-peer-deps. The candidate changes 89 version/path entries, including
transitive updates and hoisting; it is not a six-line-only dependency change.

Extracted the same source archive into `.audit/payload389-source` and copied only
the candidate manifests into its owner-platform. `npm ci --ignore-scripts`
installed 728 packages successfully (`0f070e`). Candidate lock SHA-256:
`0B66DA1FA222DA140507D2257D280F5291DF8804A3352600BF61248BDBF0D948`.
The active repository package/lock remain unchanged.

- Package listing confirms Payload and inspected direct adapters at 3.89.0.
- Strict typecheck: exit 0 (`36e49e`).
- `npm test`: three Node script tests and 1,303 tests in 170 Vitest files pass,
  exit 0, 76.08 seconds (`0104be`).
- Auth/unlock HTTP suites on SQLite: eight passed, eight PostgreSQL-only cases
  skipped, exit 0 (`76b0c7`). Synthetic provider only; no real mail or browser.
- Candidate `npm audit --omit=dev --json`: zero reported production entries,
  exit 0 (`5ce218`); initial full audit still reported two moderate dev entries.
  This does not override the unresolved upstream advisory interpretation.

Remaining before integration: inspect complete transitive delta, full editorial
and media integration, PostgreSQL-specific authentication/admission, physical
recovery, production build and authorized visual/editor regression. Candidate
success is not deployed or active-CMS success. Docker DNS remains unmodified.

## Editorial/media recheck and unresolved worker exit

The first combined Windows candidate run ended with exit 1 (`ec6704`):
21 passed, two skipped out of 43 discovered tests; two of three files passed,
and Vitest reported `Worker exited unexpectedly`. That run is not a pass.
Its truncated terminal output does not identify a definitive native or runtime
cause. Expected synthetic object-storage errors must not be confused with the
unhandled worker termination.

Without changing code, dependencies, timeouts or configuration:

- Isolated editorial suite with verbose reporting: 35 passed, two PostgreSQL-only
  cases skipped, exit 0 in 19.74 seconds (`c8f429`).
- Repeated the original three suites with verbose reporting: all three files
  passed, 41 tests passed, two PostgreSQL-only cases skipped, exit 0 in 46.06
  seconds (`52f758`). Includes full-config filesystem/object restoration and
  authenticated HTTP media failure/rollback paths using synthetic storage.

This establishes a successful recheck, not a diagnosed or fixed intermittent
worker failure. Retain that finding for the remaining build/PostgreSQL/recovery
gates. No browser was opened and the active CMS remains on Payload 3.88.0.

The candidate full audit (`c6dcb1`) reports two moderate development entries:
Vitest and @vitest/mocker 4.1.10, GHSA-82fw-gwwq-j7x9. The reviewed
[upstream advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)
lists 4.1.11 as patched. It concerns redirect mock file access through development
server interfaces, with reachability/authentication preconditions; it does not
by itself demonstrate exposure of this CMS production deployment. A separate
isolated runner update is the next dependency experiment, not a presumed cure
for the unexplained worker exit. No Vitest update has been applied yet.
