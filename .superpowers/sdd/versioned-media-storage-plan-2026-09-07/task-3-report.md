# Task 3 report — protected native HTTP media flows

Date: 2026-09-08

Implementation base: `dbc37ae`
Status: implemented and verified within the opt-in binding/fixture boundary; not activated in the application config.

## Scope and result

- Added a bounded Node HTTP fixture on an ephemeral literal `127.0.0.1` port. It delegates to Payload's real `handleEndpoints`, creates a real owner, obtains the real login cookie, and exercises multipart upload, crop, duplication, restore, download, trash and denied mutation endpoints over HTTP.
- Reused `editorialDatabaseConfig`. SQLite uses its runner-owned database; PostgreSQL uses the separate `versioned_media_http_fixture` schema inside the runner-owned loopback SCRAM cluster.
- The only `skipSafeFetch` exception is fixture-local and matches the exact protocol, host, ephemeral port and `/api/media/revision/**` path. Tests reject a different host, port, protocol and path.
- Added optional `nativeFetchOrigin` to the opt-in factory. It accepts a canonical HTTPS origin, or HTTP only for literal ported `127.0.0.1`. Native crop/duplicate fail closed without it and require an owner plus an exact `Origin` match.
- Native crop selects the current source through Payload access control and replaces caller `url`/`filename` with the stored record/revision selectors before refetch. Caller revision reassignment and prefix assignment remain rejected. Duplicate refetch uses Payload's generated upload URL field hook plus a request-scoped source-ID capability; it never accepts the caller URL as its source.
- Exact same-name/same-byte aliases produced by Payload are stored once after comparing the complete buffers. Same-name/different-byte aliases fail before a revision is written. The revision-store's existing ambiguous-name and case-collision rejection is unchanged.
- The delivery endpoint returns exact stored bytes with `private, no-store`, `nosniff` and a restrictive CSP. Range is deliberately ignored: the complete authorized file is returned as `200`, with no `Accept-Ranges` or `Content-Range`; a range never bypasses authorization.

## TDD evidence

The first exploratory no-`Origin` socket request failed with a malformed `http:://.../api/media/file/...` refetch URL. That was a fixture/browser-fidelity defect (a real browser POST supplies `Origin`), so it was retained as a diagnostic limit and is **not** counted as the native production RED. The fixture now sends its exact socket origin; production code does not derive trust from `Host` or normalize `req.protocol` to hide this behavior.

1. RED — `node scripts/test-integration.mjs -t "duplicates a revision-backed image"`: browser-equivalent request with exact `Origin` returned `500`. Payload duplication ran field `afterRead` hooks but not the collection `afterRead`, leaving `/api/media/file/...`; the exact revision-only safe-fetch allowlist correctly rejected it.
2. GREEN — the binding composes a generated `url` field `afterRead` hook and uses only the request-scoped `duplicateFromID`; the same focused command passed `1/1` through the real `/api/media/:id/duplicate` endpoint.
3. RED — `node scripts/test-integration.mjs -t "crops and restores immutable"`: once the native update used the server-selected source URL, Payload generated an original and a `withoutEnlargement` alias with the same filename; the strict file list rejected the duplicate name and the endpoint returned `500`.
4. GREEN — full-buffer identity deduplication in the binding admitted the identical alias while rejecting a conflicting buffer before persistence. The focused crop/restore command passed through real PATCH and version-restore endpoints.
5. RED — focused origin/selector security cases initially reached safeFetch and returned `500` for a mismatched `Origin`; the controlled receiver observed no request. This demonstrated that safeFetch alone did not express the cookie-bearing native-refetch trust boundary.
6. GREEN — exact configured-origin/owner guards, body `focalX`/`focalY` detection, create-without-upload rejection and server-selected selectors passed together. Both rejected-origin and forged-selector cases left the controlled receiver at zero requests/cookies and preserved record/revision state.
7. Final focused checks after type-only amendments: `node scripts/test-integration.mjs tests/versioned-media-http.integration.test.ts` passed `1` file / `6` tests; `npx vitest run src/media/revision-storage-binding.test.ts` passed `1` file / `22` tests.

Expected Payload error logs for tested `400`/`403` denial paths and the no-email-adapter warning appeared in integration output; they are not presented as pristine output.

## Full gates

| Command | Result |
| --- | --- |
| `npm test` (owner platform) | exit `0`; 144 files, 783 tests passed; 64.05 s |
| `npm run test:integration` | exit `0`; 3 files, 37 tests passed; 47.94 s |
| `npm run test:integration:postgres` without `OWNER_POSTGRES_BIN` | **failed preflight**, exit `1`; no tests or data started; explicit missing-tools configuration error |
| `$env:OWNER_POSTGRES_BIN='.../postgres-tools-17.11/unpacked/pgsql/bin'; npm run test:integration:postgres` | exit `0`; PostgreSQL 17.11; 3 files, 37 tests passed; 50.30 s; child and sessions closed |
| `npm run lint` | exit `0` |
| first `npm run typecheck` | **failed gate**, exit `1`; four new Payload hook/config typing errors |
| corrected `npm run typecheck` | exit `0` |
| `npm run check:public-boundary` | exit `0`; 21 public app entries passed |
| `npm run check:public-bundle` | exit `0`; 10 routes within existing tolerance |
| `git diff --check` | exit `0` |

The PostgreSQL runner reported `testProcessClosed: true`, `databaseSessionsClosed: true`, exact-cluster shutdown and removal of only its synthetic run root. Every HTTP fixture and controlled receiver uses `finally`/fixture cleanup to close its exact listener and tracked sockets; no fixed port or background listener is retained.

## Files and commit

- `owner-platform/src/media/revision-storage-binding.ts`
- `owner-platform/src/media/revision-storage-binding.test.ts`
- `owner-platform/tests/media/http-fixture.ts`
- `owner-platform/tests/versioned-media-http.integration.test.ts`
- `.superpowers/sdd/versioned-media-storage-plan-2026-09-07/task-3-report.md`

Implementation commit: this report is committed with `feat(owner): verify native revision media over HTTP`; the controller records the resulting hash.

Controller documentation commits `cda81b4`, `354e5b6` and `bb82a45` are separate from this implementation and remain in the review range from `dbc37ae`.

## Limitations and non-claims

- The factory remains opt-in and is not activated in `payload.config.ts`; no public UI, checkpoint, existing media, provider, credentials, publication or data migration changed.
- Payload's installed `getExternalFile` forwards the request cookie while following redirects. This fixture's exact revision handler returns a file or error and never redirects, but a future redirecting proxy/hosting configuration is **not certified** by this evidence and would need a separate redirect policy/proof.
- The suite proves native behavior and authorization for synthetic bounded fixtures in SQLite and PostgreSQL. It is not a production-scale, recovery-provenance or final storage-readiness claim.
- Existing full owner-isolation/destructive build proof was intentionally not run or weakened. Public-boundary and public-bundle comparison are limited evidence only.

## Review fix round 1 — latest draft source selection

Review found that the native-edit prefetch selected the published document unless the request query contained `draft=true`, while Payload 3.88 `updateByID` independently retrieves the latest collection version before it applies a crop/publish update. With published revision A and newer draft revision B, a crop that also published B therefore compared or fetched A.

- RED on `339fb8d`: `node scripts/test-integration.mjs tests/versioned-media-http.integration.test.ts -t "crops the latest draft image"` failed `1/1`; the real PATCH returned `400` (`Storage revision cannot be assigned by a caller`) instead of `200` when the request supplied B's revision.
- Minimal fix: the access-checked `findByID` source lookup now always requests Payload's draft/latest view. It does not infer the source from caller `_status`; without a newer draft, Payload falls back to the published document.
- GREEN: the identical focused command passed `1/1`. The regression creates distinct red published A and blue draft B images, crops and publishes B without `draft=true`, then decodes the persisted original with Sharp and verifies literal `600x400` dimensions plus blue `[0, 0, 204]` pixels.
- SQLite: `node scripts/test-integration.mjs tests/versioned-media-http.integration.test.ts` passed `1` file / `7` tests (10.82 s).
- PostgreSQL: configured portable 17.11 tools plus `npm run test:integration:postgres` passed `3` files / `38` tests (52.42 s), including HTTP `7/7`; child and sessions closed, exact cluster stopped, and only its synthetic root was removed.
- `npx vitest run src/media/revision-storage-binding.test.ts` passed `1` file / `22` tests; `npm run lint` and `npm run typecheck` both exited `0`.

Expected denial-path errors and the no-email-adapter warning remain visible and disclosed. No logging-framework cleanup, active configuration, provider, data, public surface or broad verification was added in this scoped fix.
