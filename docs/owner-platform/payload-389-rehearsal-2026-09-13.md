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
