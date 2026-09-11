# Native page trash and recovery

Base `9f99c6d`, reservation `9d071f08-49ba-4c69-bb4d-280d0911fed4`.
Only production-browser test helpers change; no application behavior, schema,
dependency, public page, deployment or real data operation.

## Scope

The page authored by the media browser gate is moved to trash through the
native document menu and confirmation modal. The test first checks the
permanent-deletion checkbox is off, verifies the soft-deletion PATCH and
deletedAt, then opens that document's native trash route and restores it.
Restore-as-published must remain off. The restored document must be a draft
with unchanged ID, title, slug, complete layout and media/placement references.
The enclosing runner subsequently compares it again after an actual app restart.

The helper requires loopback origin and a synthetic native-media fixture slug.
No DELETE request is used. This does not cover permanent deletion, bulk trash,
restoring an already published document, or a full database/provider disaster
recovery. Those have distinct contracts and must not inherit this result.

## Evidence

- Initial `507040` stopped before any deletion because the harness guessed
  `.popup__button`. Installed PopupTrigger uses `.popup-button`; the test now
  selects the button by role inside the known document-menu wrapper. This is
  a harness correction, not an application defect or a newly implemented UI.
- Final build/browser `3db9d8` / `d11a8e`, exit 0: native soft-delete and draft
  restore at 390 and 1280 px, content and relationships preserved. Existing
  native media creation, accessible placement, crop preview, six pages/two
  brands/two placements after restart and private object checks also pass.
- Owned app/cluster shutdown and fixture-root cleanup confirmed on both runs.
- Syntax/diffcheck `59bc41`, focused ESLint `6d51df` pass. No new full unit or
  PostgreSQL integration sweep is claimed for this test-only delta.

Provenance: isolated checkout at `8bd695e` with the explicit current source
overlays and these browser helpers. Chromium viewport emulation, synthetic
PostgreSQL and private object fixture; not a physical-device or cloud deployment.
The prior native-media and relationship-label reports retain their own scopes.

Next acceptance work: consolidate remaining editorial workflow gates against
current code, including publication preparation and recovery; staging remains
subject to provider/account authority and is not approved by local test results.
