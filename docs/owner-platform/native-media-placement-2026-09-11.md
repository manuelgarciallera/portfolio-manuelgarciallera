# Native media upload and crop editing

Base `d57eb3a`; reservation `f20604ab-7595-4700-a596-8ea422e30b7c` sent to Claude.
No visual redesign, public deployment, new dependency or schema migration.

## Verified scope and defect

The production-browser gate now uploads a synthetic PNG through the native media
creation form. A placement is then prepared through authenticated API as fixture
setup. The actual crop editor performs keyboard focal/zoom changes, mobile frame
override, save and reload. This does not prove native placement creation, inserting
the placement into a page, or persistence of that placement across app restart.
The existing runner separately verifies pages, brands and media across restart.

The real form accepted a PATCH while the custom zoom remained editable: RED
`6476e4`, assertion false versus expected true, with owned infrastructure closed.
Unlike native fields, MediaPlacementEditor did not subscribe to form processing
or initialization. It now follows both native contexts, respects readOnly, disables
the five editing controls, and guards their update handler. Preview breakpoint
buttons remain usable because they do not change the document. Server access
checks are unchanged; client disabled state is not authorization.

## Evidence and test repair

- First attempt `497263` had a test-harness error: a held route was released in
  cleanup before its asynchronous continuation completed, obscuring the intended
  assertion. The test now records disabled state, releases and waits for the
  response, then asserts. Native upload and crop interaction had already executed.
- That abrupt run left synthetic infrastructure. The exact cluster at
  `owner-postgres-recovery-rYRj4p` was stopped with pg_ctl. The old Next process
  was terminated using its container PID after identifying it; host docker-top
  PIDs must not be passed to container kill. Its synthetic artifact root was
  retained, not recursively removed as part of this repair. No real service/data.
- Correct RED `6476e4` reproduces the intended save-state defect and verifies
  normal runner cleanup. No runtime code was changed before that reproduction.
- Initial GREEN `360e75`, exit 0: native upload and keyboard crop at 390/1280,
  mobile override remains separate from desktop on reload, preview reflects
  focal/zoom values, media storage revision remains unchanged. Existing editor,
  second-brand/page, private object and restart checks still pass.
- Typecheck `db612e`, focused lint and script syntax `a6efb5` pass.

The final test additionally checks all five controls freeze and subsequently
become editable, not only the zoom. Final verification is recorded below.
All content is synthetic and Chromium viewports are emulated, not physical phones.

## Review refinements

Independent read-only review correctly rejected revision equality alone as
evidence of an unchanged original: legacy mode can have two undefined revisions.
The test now downloads the authenticated original before and after the crop and
compares actual nonempty bytes. It also waits for all five controls to re-enable
before reloading, so reload cannot hide a stuck processing state. These findings
were addressed without weakening the test or adding application behavior.

The first integrity-check attempt (`313ee6`) failed before cropping because
Playwright's Node request context does not inherit Chromium's ephemeral SPKI pin.
The fixture was shut down normally. Downloads now use same-origin fetch inside
the already pinned authenticated browser, with a 10-second bound and SHA-256 plus
byte-length comparison. TLS verification is not globally disabled. Its failed
request diagnostic contained only a synthetic test cookie, not a real account;
do not copy request diagnostics into the Hub or public artifacts.

Full owner unit suite `f991d9`: 1,286 / 169 files, exit 0, 71.86 seconds. No build
ran concurrently with this Windows suite. This is not a new full PostgreSQL
integration sweep; the changed runtime is the client crop editor only.

Final production build/browser `1abcd8`, exit 0: the expanded five-control,
pre-reload re-enablement and original digest checks pass at 390 and 1280 px,
alongside existing page/brand/private-object/restart checks. Owned app/cluster
shutdown and synthetic-root cleanup are confirmed. Object-backed mode was run;
the digest check supports legacy URLs but this receipt does not prove a legacy
browser run. Public guards `2f886e`: 14/14 and 21-entry boundary pass.

Provenance: isolated base checkout `8bd695e` plus explicit current source/test
overlays, not a clean checkout of the eventual new commit. Next gate is native
placement creation and page embedding, then extending restart verification to
those authored placements. No new provider or large UI change is needed for
that local test work.

## Native creation gate (follow-up on 4e6cd80)

Reservation `bbfed730-4ec8-44d4-a591-05975a42944b`. The browser test now
opens the native placement creation form, names the placement, selects the
uploaded asset in the native drawer using the keyboard, saves and checks the
returned name and asset ID. No application code, schema or dependency changed.

Two harness assumptions were investigated before changing the test:

- `65ba9d` timed out locating the asset by its alt text as a button. The
  diagnostic accessibility snapshot in `3d0d8d` shows the actual table selects
  through its filename button; alt is a separate cell. Selection now locates
  that asset row and its filename button, not an arbitrary first result.
- `a068e6` / `fad274` saw no POST after immediately pressing Save. The native
  Upload Input awaits `populateDocs` before updating the field and closing its
  focus-trapping drawer. The test now waits for that drawer to close and the
  selected asset image to appear before saving. No sleeps, forced clicks,
  direct form-state mutation or API fixture creation were added.

Those failed runs closed their owned app and cluster and removed their synthetic
test roots. They are harness failures, not proof of an application defect fixed.
Final run `22682b` / `34eb95`, exit 0, verifies native upload **and placement
creation** at 390 and 1280 px, followed by crop save/reload, independent mobile
override, five-control save blocking and original byte integrity. Existing
four-page/two-brand and private-object restart checks also pass; owned app and
cluster cleanup is confirmed. Script syntax and focused ESLint `d5a2c0` pass.

This is a new production build/browser run, not a new full unit/integration
sweep. Base checkout remains `8bd695e` with explicit overlays through `4e6cd80`
plus this test. Placement restart and embedding in a page are still the next
gate, not proven by the page/brand restart assertions. No public deployment.
