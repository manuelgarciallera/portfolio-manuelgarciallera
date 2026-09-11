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
