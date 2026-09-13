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
