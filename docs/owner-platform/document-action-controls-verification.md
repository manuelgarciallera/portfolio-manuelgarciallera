# Document actions: form integration and publication evidence

## Scope

The owner editor's six custom publication, Figma and assistance controls were
mounted inside Payload's document form but rendered nested forms themselves.
The browser regression reproduced two forms for each component at 1280 and
390 pixels before the correction. The controls now use a labelled fieldset,
controlled input values and explicit non-submit buttons. Enter in action inputs
invokes the action; textarea Enter remains a newline and IME composition is not
submitted. Native fieldset disabling freezes the decision and fields while the
request is pending and after successful completion.

The layout retains the existing grid, spacing and mobile stacking; the fieldset
has its native border, padding, margin and minimum width reset. These are private
CMS components. No public design, dependency or deployment changes are involved.

## Browser component regressions

Run `npm run test:controls` in `owner-platform`, with the repository's existing
Playwright/Chromium installation available. esbuild bundles the real React
components, styles and clients in memory; no fixture files are emitted. All
browser requests are intercepted on `owner-controls.invalid`, and unknown hosts
are blocked. Only Payload's document context, Next's link boundary and API
responses are substituted. No real Figma export, AI call or publication occurs.

The matrix covers six controls plus the three rejection decisions at 1280 and
390 pixels (18 cases). It checks invalid confirmations before transport,
textarea newlines, exact endpoint/method/body, input/button viewport bounds,
pending fields frozen during a deliberately held response, successful result
links/status, prevention of repeat actions, and no parent form submission or
runtime exception. The pending-field regression failed before native disabling
was added. This harness demonstrates frontend behavior, not backend correctness.

## Actual Payload and database findings

`OWNER_QA_PUBLICATION=1 node tests/dashboard-refresh.browser.mjs` extends the
isolated QA dashboard test (loopback port 3011, synthetic owner credentials) to
prepare a bundle, navigate its real Payload editor, approve it, generate an
artifact, and create the preflight report. `OWNER_QA_VIEWPORT=mobile` uses
390 × 844; the default is 1280 × 720. Use this mode separately from restoration
and simulated dashboard failures. The test waits for Payload's actual
`data-form-ready` signal before interaction; immediate typing into server-rendered
markup otherwise preceded hydration and was reset. No arbitrary sleep is used.

Once reachable, the review endpoint returned HTTP 400. A real SQLite integration
regression exposed string URL IDs being written into numeric relationships.
After fixing review, the same failure became observable in artifact creation,
then preflight creation. Each failure was recorded before its correction.

Each service now retains the ID type returned by its owner-authorized document
lookup, verifies it identifies the requested record, and uses it for the write
and any canonical hash inputs. Permissions, unique constraints, integrity checks
and immutable records are unchanged. UUID/string database IDs remain strings;
there is no unconditional numeric conversion or schema migration.

The integration test exercises actual persistence through the three services,
including the URL-string inputs, reads the stored preflight relationship at
depth zero, and verifies the page is unchanged. Only Next's `server-only`
build-time marker is substituted for Node tests; the services and database are
real. Existing production/PostgreSQL and public-isolation release gates remain.

## Remaining scope

Figma and assistance action UI behavior is covered by the component harness;
live credentialed Figma imports and AI-provider execution are not certified by
these tests. The published portfolio still reads its existing checked-in content.
No automatic application, publication or deployment has been enabled.

The subsequent [assistance and Figma persistence verification](assistance-figma-persistence-verification.md)
adds actual SQLite service-path coverage with synthetic external Figma responses;
it still does not certify live credentialed provider access.

## Recorded verification

- Browser component matrix: 18 cases passed, including delayed responses and
  both decision outcomes where available.
- Actual Payload publication flow: passed on desktop and mobile with synthetic
  records in the isolated QA database; the page remained unchanged.
- `npm run check`: 612 unit tests, 10 real SQLite integration tests, lint,
  TypeScript and owner production build passed.
- Independent read-only review approved the final correction. Its decision-edit
  race finding was reproduced and fixed with the disabled fieldset.
- Public guard suite: 11 tests passed; all 20 public entry points remain isolated.
  Fresh proof from `b66e81003108df1343c45811ed9b04df994b1e37` plus this owner-only
  work retained public input hash
  `d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`
  and showed zero bundle regressions across nine routes.
- The protected checkpoint remains `0f0adf686b2752e23c25d224f8c60815b10fd451`.
  No deployment, real credentials, production database or public bridge was used.
