# Full configuration media acceptance — 2026-09-10

Base: a7f45883da1e731e622fdcd0cb94be8c372fe50e. Reservation: 16d6fe7b-13e5-4f3f-9ecb-1a9c69bf998b.

The isolated HTTP fixture can now consume the real owner collection configuration,
replacing only its database and Media storage. The default application configuration
continues to use its existing storage; no provider or production cutover is enabled.

`createOwnerConfig` exposes the raw configuration before Payload sanitization.
The fixture selects this explicitly with `fullOwnerConfig`; existing fixtures keep
their smaller collection set by default.

## Evidence

- RED: pages returned 404 in the previous Users/Media-only fixture.
- GREEN: upload a synthetic PNG, create a draft page with a hero image relation,
  read its populated image ID and immutable URL, fetch the original bytes exactly.
- Isolated SQLite and loopback HTTP, real Payload collections and endpoint handling.
- Integration: 1/1; unit suite: 1106/1106 in 157 files; typecheck and lint exit 0.
- Public dependency boundary: 21 entries; diff check exit 0.

## Limits and next owner

### Follow-up: captured media after replacement

The full-configuration test additionally creates a real published brand profile,
captures the page through `createPagePreviewSnapshot`, replaces the image through
HTTP PATCH, and captures it again. It asserts different storage revisions, the
first persisted manifest remaining unchanged, and exact original and replacement
bytes still retrievable through their respective authenticated URLs.

This characterizes existing behavior; no production change was needed. The first
execution passed at runtime but typecheck rejected a nullable authenticated user.
An explicit guard was added to the test before constructing the local request.
It is not a restoration execution or browser test.

This is not a Next browser acceptance test, PostgreSQL result, restoration execution,
object-provider verification, deployment, or production readiness certificate.
No real user data, mail, paid services or public assets were changed.

Codex next: exercise this configuration through the actual admin browser flow,
including restoration. Claude may review these changes without
writing to the shared repository. Storage cutover and PDF/CV publication remain
separate gates described in media-cv-operational-gap-2026-09-10.md.
