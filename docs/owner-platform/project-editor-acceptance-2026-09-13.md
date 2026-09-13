# Modular project editing in the autonomous browser harness

Status: browser acceptance passed; test-only change, no application fix.

Extends the existing modular-editor browser scenario into the synthetic
production harness. A project fixture with a caseQuote block and no classic
body is created through the authenticated API. The native form edits its title
and saves; reload verifies content, draft status and image relationship.
The HTTP harness then checks anonymous draft listing and full document equality
after a real application restart. This catches making an unused classic body
mandatory, duplicating modular text into that body, or losing saved edits.

Scope deliberately distinguishes API fixture creation from native authoring.
This does not yet cover native project creation, project preview, every block,
or project history privacy. It adds no runtime, schema or visual changes.

First execution86187 failed before project creation (68322a): Playwright's
APIRequestContext does not inherit Chromium's narrowly pinned synthetic TLS
certificate. The runner closed its application and cluster. No app defect was
established. The helper now uses same-origin fetch in the authenticated browser,
matching other harness modules; no ignoreHTTPSErrors/global TLS bypass added.
Syntax/lint/diffcheck pass fab83f. Re-run 90831 completed with exit 0
(705ce8): native project editing passed at 390 and 1280 px; both draft fixtures
remained private in anonymous listing and matched their saved documents after
a real application restart. Existing page/article, media, history restoration
and publication preflight scenarios also passed. The runner closed its owned
application and cluster and cleaned its isolated root.

The test used the earlier Linux overlay, not a clean checkout of the eventual
commit. It does not establish a clean dependency install, physical-phone
compatibility, production readiness or resolution of the intermittent Windows
native crash. No deployment or public content changes were made.
