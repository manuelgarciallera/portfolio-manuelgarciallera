# Publication UI: external runtime dependency found

Base `ce85688`; reservation `04b563af-3fa6-4423-817a-0b15055d2a14`.
Status: **RED, not resolved**. No deployment or public runtime change.

The new production helper reuses publication-flow.browser.mjs against the
isolated PostgreSQL/object runner. Snapshots, release and bundle are explicit
API fixtures with synthetic quality values, not measured scores. Review,
artifact generation and preflight use the real native document panels.
Requests remain in the same-origin authenticated SPKI-pinned browser.

Both runs (`2a12e2`, diagnostic `9cbb5c`) reach all three UI actions and
preserve the source page, but fail the no-pageerror assertion with two Event
errors. Owned app/cluster cleanup completes normally. The error is not ignored.

Diagnostic request failures identify:

- cdn.jsdelivr.net, /npm/monaco-editor@0.55.1/min/vs/loader.js,
  net::ERR_INTERNET_DISCONNECTED, then Monaco initialization error.
- www.gravatar.com avatar requests also fail without external networking.
- Same-origin aborted navigations are listed separately and are not evidence
  of a failing mutation.

Installed @monaco-editor/loader/lib/cjs/config/index.js defaults to that CDN.
Payload's CodeEditor delegates to @monaco-editor/react. PublicationBundles,
PublicationArtifacts and PublicationPreflights contain read-only JSON fields,
so opening their documents invokes that editor. The native forms themselves
complete; the dependent JSON surface does not initialize offline.

Next: retain native editor capability while serving its version-matched assets
from the owner deployment, and use a local/default non-network avatar. Check
supported configuration before implementation; no node_modules patch, browser
network bypass, ignored console errors or substitute success condition. Keep
this out of the public portfolio bundle. Verify under the same disconnected
fixture, including actual JSON rendering and absence of external requests.

The new test helpers remain uncommitted work in progress until the regression
is resolved. Syntax/lint `f92c42` pass, but this is not a green acceptance gate.
The prior green checkpoint remains `ce85688`, with local incremental backup.

## Follow-up: local asset preparation and private loader instance

2026-09-11, base `c7b17f7`. Still **RED**; runtime work is uncommitted.

- Added a local asset preparation test, initially missing module (`d23551`),
  then passing byte comparisons for the installed loader, editor entrypoint,
  license and every installed worker asset (`f8a66a`). This narrow test does
  not prove browser initialization. Existing Monaco 0.56.0 and React adapter
  4.7.0 are pinned as direct owner dependencies; no new public dependency.
- Local preparation runs before owner dev/build and the isolated production
  runner. Installed/pinned version mismatch fails rather than shipping an
  incompatible URL. Generated assets are ignored, not committed binaries.
- Provider attempt using the loader package failed the browser gate
  (`ec6c30`). Importing its public React adapter loader did not fix it:
  `fe8755` still requested CDN 0.55.1 and timed out awaiting the real editor.
  Both owned test environments closed and cleaned normally.
- Separate build failure (`ed06cb`) identified Monaco package exports hiding
  package.json. The preparation reads installed metadata via filesystem;
  client version comes from our own pinned manifest, with equality checked
  by preparation. No node_modules patch.
- Independent read-only review identified a test gap. The publication helper
  now waits for the native Monaco view; the isolated wrapper additionally
  requires local loader and JSON worker responses and a populated JSON model.
  These stronger checks are currently red, not waived.
- Root cause of the ineffective provider: installed Payload UI's exported
  client build has a lazy CodeEditor chunk importing a prebundled chunk with
  its **own inlined loader/state-local instance**. Configuring the separate
  npm loader does not change that instance. Build chunks confirmed two loader
  copies (`d8bc38`, `c52781`); this is not a missing copied worker.

Next: evaluate the supported field component extension to initialize local
Monaco on demand before mounting Payload's native JSONField. Preserve all
field props, permissions, error behavior and editor functionality; do not
eager-load Monaco for every admin screen. The ineffective provider must not
be committed as a working fix. Gravatar remains separately unresolved.

Primary reference for the public loader configuration API:
https://github.com/suren-atoyan/monaco-react#loader-config . Installed Payload
bundled code, not that API alone, determines actual integration behavior.
