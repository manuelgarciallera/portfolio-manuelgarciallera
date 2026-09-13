# Native restore first-click diagnostic

Base: `8dd62b2` (runtime `aca05e0`). No owner runtime or public changes.

## Reason

Full editor run 42282 previously timed out waiting for `.restore-button` after one click on Restaurar. Later full runs passed; those passes did not establish a fix. Inspecting Payload 3.89's RestoreButton and ConfirmationModal shows the click opens a modal slug; no form submission is required to open it.

## Focused executable

From owner-platform with the existing isolated PostgreSQL tools:

```text
node scripts/test-production-http.mjs --browser-trash-probe
```

This retains the synthetic production build, loopback-only PostgreSQL, ephemeral pinned HTTPS certificate, native browser login, and owned-process cleanup. It is mutually exclusive with `--browser-editor`, so the result cannot claim the complete editorial journey passed.

At 390 and 1280 px it creates and soft-deletes one synthetic draft by API, opens the native trash detail, clicks Restaurar once, checks draft-only restoration by default, and cancels. Twelve fresh navigations per viewport, no second-click retry and no added readiness wait. On the twelfth it confirms restoration through the real UI and verifies id/title/slug/layout and draft status. It does not permanently delete anything.

## Observed results

- Initial fixture failed creation (400: required page sections missing), outputs `aedf21` / `245808`. Corrected the fixture with a valid hero section, not the CMS validation.
- Final session 88859: all 24 first clicks opened the dialog (`6c0d2b`), both final UI restorations preserved content, no page errors. Final `a12b36`: exit 0, production HTTP login/privacy/restart checks also pass, owned app/cluster closed and isolated root cleaned.
- `form[data-form-ready="true"]` count before every click was zero, including all successful opens. This diagnostic is **not an established readiness gate for the trash action**; inserting that wait without further evidence is unjustified. It does not prove that hydration was complete or incomplete.
- Syntax, scoped ESLint and diff whitespace checks passed (`fa07e4`, `aca5e6`). No new complete unit suite: changes are confined to the diagnostic harness and its dispatch.
- Runtime tested from the prior exact-checkout directory with these three test files overlaid, not a new clean SHA checkout. Linux Node 24.18/PostgreSQL16; not physical-device or Windows-native verification.

## Still open

The original intermittent failure is not reproduced or fixed by this run. The focused setup uses API soft deletion and a simple hero block, unlike the full journey's native deletion following media editing/preview. Next discriminate that transition/context with the same diagnostics before changing runtime or upstream code. Retain full journey coverage in browser-page-trash.mjs. No deployment, provider configuration, credentials, dependency, or public bundle change.

## Follow-up: native deletion transition

The probe now additionally executes six complete native soft-delete/restore cycles per viewport, reusing the unchanged browser-page-trash.mjs journey. Creation remains a synthetic API fixture; this does not claim native creation coverage. Each cycle checks the same content, draft-only status, and restored document route before the next deletion.

Session 41541: twelve native cycles passed (`428d11`, `5c843b`, `cb46d1`) plus all 24 first-click/cancel probes and final restorations (`ab2486`). Terminal report `075b0d` confirms HTTP privacy/restart checks and owned-process cleanup. Scoped syntax/lint and diffcheck passed (`5f9264`). No sleeps, second-click retries, relaxed assertions or runtime modifications added.

The original timeout remains unclassified. Neither fresh navigation alone nor repeated native deletion of a simple page reproduced it. Preserve the failure diagnostics in the full media journey; do not repeat full suites indefinitely or mark the incident fixed. Next priority is the existing operational account-recovery gate, documented in recovery-global-exhaustion-2026-09-13.md. No provider activation or credential change is authorized by this diagnostic.
