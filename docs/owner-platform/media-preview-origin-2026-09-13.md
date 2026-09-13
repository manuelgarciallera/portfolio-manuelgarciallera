# Owner media preview origin — verification in progress

Base: 11f75eb. Public production remains 45a1855; no owner deployment.

## Cause and bounded correction

The production HTTP/browser harness returned a native Payload media document whose URL was absolute (`https://127.0.0.1:<port>/api/media/file/...`). The placement presenter only accepted relative paths, so the selected image never rendered. This was reproduced before the change (15008c).

The presenter now takes an optional explicitly trusted origin. Browser caller supplies window.location.origin; private server preview supplies Payload config.serverURL. Absolute URLs are normalized to relative paths only on exact origin equality, with no URL credentials. Existing revision ID/filename binding remains enforced. Callers without an origin remain relative-only. No new network requests, providers, dependencies or public bundle changes.

## Evidence this turn

- RED presenter: 8a8be3, expected valid native absolute URL rejected.
- RED server preview: 0fd1f9, expected image absent.
- GREEN focused presenter/server: 29 tests f2d57b; added revision/no-origin regression: 20 presenter tests e8e6c3.
- Full unit suite: 1322 tests / 171 files, exit 0 b2c726. Test environment emits two no-email-adapter warnings; not a real email delivery test.
- Typecheck exit 0 a54e7f; focused ESLint and diffcheck exit 0 7d3374.
- Docker browser run 42282 is still active: native mobile upload, placement creation, crop save/reload and original preservation pass (082877); native media block and mobile crop preview pass (817082). Desktop, restart and final HTTP assertions not yet confirmed.
- Container owner-editor-6dc5c51-0911, pwuser, overlay /tmp/owner-payload389-D25sDX/owner-platform. Not an exact-commit checkout. Do not restart on observation timeout; poll 42282.
- Protected checkpoint dereferenced to 0f0adf686b2752e23c25d224f8c60815b10fd451 (bbb7b4).

## Handoff

Codex owns completion: observe terminal run result; review and commit only own files after full verification, then create recoverable bundle. Keep unrelated shared documents and private directories out of commit. The earlier project-version-detail assertions and diagnostic catch remain uncommitted; full harness must actually reach those assertions before claiming coverage. No CMS publication authorized here.

Previous goal turn made progress: public Contact defect fixed and deployment verified. Current goal turn changes owner runtime and provides fresh RED/GREEN evidence; overall CMS goal remains incomplete.

## Terminal result superseding the running status above

Run 42282 terminated exit 1 (2e75e5): after the successful mobile media flow, browser-page-trash.mjs:23 timed out waiting for .restore-button. Owned app and cluster closed, isolated root cleaned. Do not poll or restart this terminal run blindly. Next action is inspect the trash UI/harness and reproduce with focused diagnostics; desktop/restart/version-detail coverage still unproven. Runtime changes remain uncommitted pending investigation.

## Completed repetition

Run 57908 repeated the full production build and browser/HTTP harness with failure-only trash diagnostics, no trash runtime change and no skipped assertions. It passed at 390 and 1280 pixels, including soft-delete/draft restore, immutable release capture, review/preflight, historical restore, article and project editing. Project exact-version detail is readable by owner and forbidden anonymously. Six drafts, two brands, two placements, two articles and two projects survive process restart (d922af). Exit 0 and owned app/cluster closure and cleanup confirmed a47f24.

The earlier trash timeout is intermittent and remains unresolved; a successful repetition is not a correction. The installed RestoreButton/ConfirmationModal still uses the expected selector. Failure diagnostics are retained for the next reproduction. No arbitrary sleep or retry was added.

All three runtime files match host/container SHA256 (33a25f). This verifies the overlay, not an exact commit checkout. Next Codex: recoverable commit, then exact-checkout regression and investigation of intermittent readiness failures; no deployment.
