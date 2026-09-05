# Media placement editor: save and keyboard verification

## Corrected behavior

The custom crop editor now marks the Payload form as modified when any crop control changes. Previously it dispatched a field update without `setModified(true)`: the visual preview could move while **Save Draft** remained disabled. This also bypassed Payload's normal unsaved-change tracking.

The three range inputs now have explicit label/control associations and unique React IDs. Previously each implicit label associated with its first labelable child, the `<output>`, leaving the range itself unnamed in the accessibility tree. Horizontal focus, vertical focus and zoom are now discoverable by name and operable by keyboard.

No crop calculation, public stylesheet, source image, dependency or publication behavior changed.

## Real browser regression

`owner-platform/tests/media-editor.browser.mjs` uses the repository's existing Playwright development dependency and a separately started synthetic owner app on **127.0.0.1:3011**. It is intentionally not part of the serverless/unit check: it needs a real browser, running app, synthetic login and seeded media.

Set `OWNER_QA_EMAIL` to the synthetic `@example.invalid` owner and `OWNER_QA_PASSWORD` to that account's password, then run from `owner-platform`:

```powershell
node tests/media-editor.browser.mjs
```

The script creates a uniquely named draft recipe in that QA database and verifies:

- A freshly loaded recipe has Save Draft disabled.
- The horizontal slider is found by accessible name and responds to the End key.
- That edit enables Save Draft, completes an actual successful PATCH, and persists after reload.
- Selecting Mobile alone does not dirty the recipe.
- Mobile vertical focus, zoom, fit and frame save independently, retaining the desktop values.

The regression was observed before correction: first the named slider could not be found; after fixing labels, the save-enable assertion timed out. With the form-modified fix, the complete browser scenario passed. The browser always closes in `finally`; test recipes remain only in the ignored synthetic QA database for inspection. No user database is used, no media binary is rewritten, and no credentials are logged or stored in browser-state files.

## Final checks

- Owner `npm run check`: 610 unit tests, 3 SQLite integration tests, lint, TypeScript and production build passed.
- Browser regression above passed against the real local Payload editor and API.
- Root public guards: 11 tests passed; dependency boundary: 20 app entries, no violations.
- A fresh isolated `build:public-proof` completed at source HEAD `266342b840960ce40e0d80e8bc982b97837219af`, with unchanged public inputs (`d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`). `check:owner-isolation` passed: runtime dependencies and lockfile match checkpoint `0f0adf686b2752e23c25d224f8c60815b10fd451`, and the nine measured public route bundles had no regressions beyond the existing fixed tolerance (1% or 2048 bytes).

These are local verification results, not a deployment approval or a replacement for production/PostgreSQL checks. The QA browser and server were closed after testing.
