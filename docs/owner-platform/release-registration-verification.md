# Local release registration and dashboard verification

## Corrected failures

The real Payload create lifecycle adds timestamp fields before the Releases
collection's `beforeChange` hook. That hook previously rejected `updatedAt` as
an unknown field, so a valid registration from the owner form failed with HTTP
400. Unit fixtures that omitted framework timestamps did not expose this.

The hook now accepts Payload's `createdAt` and `updatedAt` metadata in addition
to the existing release fields. The owner HTTP request parser still rejects
client-supplied timestamps, author overrides and arbitrary fields. Direct
collection creation, mutation and deletion remain denied to API clients;
registration still uses the owner-authenticated service and verified matching
snapshot hashes. This is not an authorization relaxation or a publication bridge.

After a successful registration, the dashboard now refreshes its summary without
remounting the registration form. Previously the registered version appeared
only after navigating away or reloading the page. A transient summary failure
now keeps the last summary and form state, clearly marks the displayed data as
older, and offers **Reintentar resumen**. A 401/403 response instead clears the
private summary. Aborted requests cannot replace a newer result.

## Real database regression

`tests/editorial.integration.test.ts` creates an authenticated owner, brand,
draft page, visual snapshot and restorable snapshot in isolated SQLite. It
then calls the actual release registration service. Before the fix this failed
with `Campo no permitido en la versión: updatedAt`. After the fix it creates
the release successfully and continues to reject anonymous reads and owner
attempts to rewrite the immutable record. HTTP parser tests separately retain
the rejection of client-authored timestamps.

The initial registration verification used in-memory SQLite. The subsequent
restore integration now uses a temporary file with transactions enabled; see
`restore-integration-verification.md` for its isolated lifecycle.

## Browser regression

`tests/dashboard-refresh.browser.mjs` requires a separately started synthetic
QA server at **127.0.0.1:3011** and `OWNER_QA_EMAIL`/`OWNER_QA_PASSWORD`. It uses
the existing root Playwright dependency. Never run against the real owner DB.

It creates synthetic brand/page data, captures matching snapshots through the
actual dashboard, fills the real registration form and submits it. It verifies
HTTP 201, the new release link in the existing summary and retained form values.
The missing-refresh assertion failed before the callback was wired; it passed
afterward without reloading the page.

Run from `owner-platform`:

```powershell
node tests/dashboard-refresh.browser.mjs
$env:OWNER_QA_FAIL_REFRESH = '1'
node tests/dashboard-refresh.browser.mjs
$env:OWNER_QA_FAIL_REFRESH = '403'
node tests/dashboard-refresh.browser.mjs
Remove-Item Env:OWNER_QA_FAIL_REFRESH
```

Mode `1` injects one 503 **only after registration**, retaining the real service,
database and all other reads. The uncorrected component lost its overview;
the corrected component preserves the form and retrieves the new release after
retry. Mode `403` injects authorization loss at the same boundary and verifies
that private summary data is removed. Development double mounts do not arm the
failure: it is tied to the action, not a guessed request count.

All three browser scenarios passed locally. Synthetic releases use random
40-character identities and explicitly manual QA scores; they are not real Git
checkpoints, production measurements or usability certifications. The script
leaves synthetic records only in the ignored QA DB and closes its browser in
`finally`. The QA server and the separate inspection browser were also closed.

This verification covers registration and summary refresh, not a new claim
that deployment, PostgreSQL migration or end-to-end restore has been tested.
The public application and the protected Git checkpoint are unchanged.

## Final verification

- Owner check passed: 610 unit tests in 138 files, six SQLite integration tests,
  lint, TypeScript and the production build.
- Public checks passed: 11 guard tests and 20 public-boundary entry points.
- A fresh isolated public build (`release-proof`) was generated from Git HEAD
  `bb85ec23c0116b3a33e43806e3239b3d4358bb74` with the owner-only working changes.
  Its input hash is
  `d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`.
  Isolation verification passed with no bundle regressions across nine routes,
  using the unchanged 1% / 2,048-byte comparison budget. Public runtime manifest
  and lockfile still match the protected checkpoint.
- No deployment, production database mutation or new public dependency occurred.

Outstanding dependency advisories and production infrastructure prerequisites
remain separate release blockers; passing these local checks does not remove them.
