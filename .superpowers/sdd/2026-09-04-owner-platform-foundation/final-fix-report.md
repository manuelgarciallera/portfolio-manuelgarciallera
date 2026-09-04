# Owner platform foundation — final fix report

Date: 2026-09-04

## Scope

This fix wave changes only the private `src/platform` foundation, its unit
tests, and `docs/owner-platform/foundation.md`. It adds no dependencies,
routes, public imports, or visual changes.

## Findings resolved

1. **Sensitive operation approval** — Added the explicit
   `replacePublishedAsset` capability. Owner `publish`, `delete`, `deploy`,
   and `replacePublishedAsset` operations now each require a valid, unused,
   unexpired approval bound to the exact operation digest. AI is categorically
   denied all four operations.
2. **Audit decision integrity** — `AuditEventInput` now accepts one required
   `AuthorizationDecision` and derives both event result and reason from it.
   Legacy separately supplied `result` and `reason` fields are rejected.
3. **Figma candidate validation** — Candidate thumbnails must be non-empty,
   credential-free standard HTTPS URLs. Supplied source metadata is checked
   against the parsed proposal provenance, and placements are passed through
   `normalizeMediaPlacement` so returned focal values, zoom, and fit values are
   safe cloned values.
4. **Hazardous record keys** — Breakpoint override and audit metadata records
   reject `__proto__`, `constructor`, and `prototype`, including JSON-parsed
   payloads, preventing prototype poisoning or disappearing fields.
5. **Connector symbols** — Exact connector-field validation now uses
   `Reflect.ownKeys` and rejects symbol properties as well as unexpected string
   properties.

## Regression coverage

The added tests cover all four approval-bound operations and the AI denial,
decision/result-reason conflicts, invalid thumbnail URLs, mismatched Figma
source metadata, normalization and immutability of nested placement data,
JSON-parsed hazardous record keys, and symbol-keyed connector objects.

The new cases were run red before implementation. The focused suites then
passed with 43 security tests, 23 content tests, and 30 Figma tests (96 total).

## Verification

- `npx vitest run --config vitest.unit.config.ts` — 32 files, 204 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `git diff --check` — passed.
- Public-source import scan — no imports from `src/platform` outside that
  private boundary.
- `npm run build` — passed; the generated route list contains no owner or admin
  route.

## Documentation

`docs/owner-platform/foundation.md` now describes the final capability set,
approval semantics, decision-derived audit events, validated Figma candidates,
and hazardous-key handling.
