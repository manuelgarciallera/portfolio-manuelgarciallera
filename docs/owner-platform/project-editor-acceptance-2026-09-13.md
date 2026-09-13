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

## Follow-up: native project creation and preview (passed)

After commit 0b9f2d2, the helper replaces API creation with the native create
form, existing media picker and quote-block drawer. It also opens the saved
draft preview and expects the edited title, summary and quote with no viewport
overflow. This targets broken form submission, lost media selection and missing
project preview content; no application implementation has been changed.

Syntax and focused lint passed 3a53b3; diffcheck passed 1f2483.
The isolated production run 8132 completed with exit 0 (03d26a).
Native project creation, media selection, editing and saved preview passed at
390 px (e26908) and 1280 px (03d26a). Both full project documents survived the
application restart; the anonymous list still excluded drafts. Existing page,
article, media, restoration and preflight acceptance also passed. The owned
application and cluster closed and their synthetic root was cleaned.

This supersedes the API-creation limitation for this quote-block scenario only.
All project block types, preview image rendering and project history privacy
remain separate coverage gaps; no application defect was found in this run.
No physical-device or clean-install claim is made. No public code was changed.
