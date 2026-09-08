# Task 2 report — owner-authorized Payload legacy-media inventory

Status: DONE. Implementation commit: `5273653` (`feat(owner): inventory legacy Payload media`).
Task base: `bb2e5fa449e5e4d115a94d78021f4bbf0a487224`. The controller-only
decisions commit `180eef5` was concurrent and was not modified or included in the
implementation commit.

## Implemented

- Added `inspectPayloadLegacyMedia({ payload, req, root })` as an internal,
  read-only service.
- Owner authorization and any non-null/undefined `transactionID`, including an
  unresolved Promise and numeric zero, are rejected with 403/409 respectively
  before any database, rollback or filesystem boundary. The request transaction
  value is not removed, replaced or awaited.
- Payload reads use the supplied request, `overrideAccess:false`, `depth:0`,
  `limit:100`, explicit `page`, `pagination:true`, `sort:'id'`, and `trash:true`
  for Media/current versions. It reads published view, latest draft view, all
  retained versions and all preview snapshots.
- Pagination rejects malformed/changing totals, unexpected page metadata,
  truncation, stalled pages and duplicate IDs. Each source rejects more than
  10,000 declared rows on its first page; sources are normalized and released
  sequentially, while a separate 10,000 normalized-reference cap spans every
  collection. Empty snapshot rows therefore remain source-bounded.
- Document/draft identities use document IDs; version identities use version row
  IDs and accept scalar or populated parent IDs; snapshots use each captured
  media ID plus the snapshot ID. Unsupported identity shapes are rejected.
- Filename, filesize and derivative metadata are projected from each stored row
  independently. No value is copied from a current row into a version or
  snapshot. State comes from the corresponding stored `_status`/`deletedAt`;
  snapshot state is unknown.
- Each snapshot passes canonical manifest hashing, stored-hash equality and
  stored provenance matching before references are consumed. Duplicate media IDs
  within one snapshot are rejected. Only the original captured filename is used.
  A revision is preserved as versioned only with an explicit `storage:versioned`
  discriminator; legacy/unknown/missing discriminator combinations retain an
  invalid-revision issue rather than gaining verified revision identity.
- The normalized references are passed to Task 1's inspector without recreating
  its filesystem, privacy, unsafe-filename, hashing or report logic. Task 1 files
  were not modified.
- Added a real isolated Payload fixture for SQLite and PostgreSQL with synthetic
  PNG A, immutable snapshot, same-name replacement B, draft, trash, Media
  versions, Users, minimal page/brand data and AuditEvents. It independently
  compares every relevant row/version/snapshot and every physical file SHA-256
  before/after the inventory.
- Added durable verification and a bounded example that requires an existing
  authenticated server request and an explicit synthetic clone root. It states
  that this is a prerequisite, not a migration, activation or production-ready
  CMS claim.

## TDD evidence

### Initial collector RED/GREEN

- Initial import RED: `npm test -- --run src/media/legacy-media-inventory-service.test.ts`
  could not resolve the not-yet-created service module. A compile-only throwing
  export was then added so assertions could fail for behavior rather than import.
- Behavioral RED, chunk `6197ae`, exit `1`: same focused command; `12/12` tests
  failed against the compile-only stub. Representative failures were expected
  403/409 objects receiving the not-implemented error, and pagination/history
  cases receiving the same stub error.
- First implementation run, chunk `42de0e`, exit `1`: `11/12` passed. The sole
  failure was an incorrect hand-entered SHA-256 literal in the test; independent
  bytes produced the stable literal
  `29ba8d1a5265485b6c345d4fec2cc5702f0ef6a8187a026f91064c51fabf118f`.
  Correcting that test expectation (not production code) yielded chunk `c12823`,
  exit `0`, `12/12`.

### Real Payload semantic RED/GREEN

- SQLite fixture RED, chunk `a317c7`, exit `1`: `2/3` passed. Payload's real
  `draft:false` result included a draft-only row; the collector incorrectly
  emitted it as both document and draft (`['1','2','3']` versus expected
  document IDs `['1','3']`).
- Minimal production correction filters `_status:'draft'` out of the published
  projection while retaining it from the explicit draft view. Chunk `788123`,
  exit `0`: focused unit `12/12`, SQLite fixture `3/3`.

### Self-review RED/GREEN

- Chunk `830f72`, exit `1`: a valid UUID attached to
  `storage:legacy-unverified` became `versioned-not-inspected`; expected truthful
  incomplete/invalid evidence.
- Chunk `34bc0d`, exit `1`: `2/14` failures demonstrated both the contradictory
  storage issue and a 10,001-row declared source being traversed 303 calls before
  the late normalized cap. Sequential normalization plus first-page source
  bounds and invalid sentinel metadata fixed both; focused `14/14` then passed.
- Chunk `bd87f9`, exit `1`: two targeted cases proved unknown and missing storage
  discriminators with a syntactically valid UUID still became versioned. The
  malformed branches now always become explicit invalid-revision evidence.
- Final focused run on the settled source, chunk `e82111`, exit `0`: unit
  `19/19` and isolated SQLite `3/3`. This includes numeric-zero transaction,
  a genuinely stalled second page, cross-collection global cap and the valid
  explicit versioned branch.

## Final verification

- `npm test` — session `28129`, final chunk `b38175`, exit `0`: `146` test files,
  `877/877` owner unit tests.
- `npm run test:integration` — session `96734`, final chunk `489954`, exit `0`:
  `4` files, `41/41` complete SQLite integration tests. The parent runner waited
  for child close and then removed only its validated synthetic root.
- `$env:OWNER_POSTGRES_BIN='...postgres-tools-17.11\\unpacked\\pgsql\\bin';
  npm run test:integration:postgres` — session `86575`, final chunk `491e31`,
  exit `0`: `4` files, `41/41` complete PostgreSQL integration tests. PostgreSQL
  17.11 ran in a fresh loopback/SCRAM cluster; test process close, zero remaining
  database sessions, exact-cluster stop and validated root removal all passed.
- `npm run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run typecheck`
  — session `19020`, final chunk `7049cb`, exit `0`, no diagnostics.
- `npm run check:public-boundary; ...; npm run check:public-bundle` — chunk
  `87ad1b`, exit `0`: public boundary `21` entries; bundle budget `10` routes.
  No baseline expansion. These use existing build artifacts, so they are not a
  complete provenance proof of a newly built public artifact; no dedicated public
  build was run, as required.

An earlier PostgreSQL invocation without `OWNER_POSTGRES_BIN` failed in preflight
(chunk `85131a`, exit `1`) before a cluster or database was created. After using
the already installed portable tool directory, preliminary session `41573`
completed `41/41`, exited `0`, closed all sessions and cleaned its exact root.
The final run above was repeated because production code changed afterward; it is
the authoritative PostgreSQL result.

Expected output retained: Payload warns that integration fixtures have no email
adapter, and pre-existing negative tests log their intentional 400/403 media
write rejections. A preliminary focused ESLint run reported three unused-parameter
warnings in test defaults; those parameters were removed and the final full lint
output is clean. No assertion failure, warning attributable to the collector,
worker crash, live exec session, PostgreSQL process or synthetic test root remains.

## Files changed

- `owner-platform/src/media/legacy-media-inventory-service.ts`
- `owner-platform/src/media/legacy-media-inventory-service.test.ts`
- `owner-platform/tests/legacy-media-inventory.integration.test.ts`
- `docs/owner-platform/legacy-media-inventory-verification-2026-09-08.md`
- This required SDD report, committed separately from the four implementation
  files so it can record their exact commit.

No active Payload config, raw Media config, Task 1 core, public file, previous
test, runner, package, schema, migration, provider, real data, CV/PDF, font, UI or
endpoint was changed.

## Self-review

- Completeness: checked every brief item against service behavior and real
  SQLite/PostgreSQL evidence. Empty Payload pagination is exercised before fixture
  seeding. Every retained reference kind and nine literal fixture identities are
  asserted, including the red-A version and old snapshot observing current B bytes
  without claiming historical identity.
- Quality: normalization stays in the Payload boundary service; filesystem and
  privacy decisions remain in Task 1. Helpers have one responsibility and all
  external result shapes are validated before use.
- Discipline: fixed only three reproduced issues (draft view semantics, bounded
  source traversal, malformed storage discriminators), each after RED. No broader
  schema, service or public work was added.
- Mutation check: tests fail for bypassed owner/transaction gates, wrong Payload
  options, skipped page/duplicate/hash/provenance validation, backfilled metadata,
  wrong reference identities/state, late limits, altered bytes/rows or a malformed
  discriminator accepted as versioned.

## Limits / concerns

No correctness concern remains within Task 2's bounded contract. Operational
limits are deliberate: no transactional snapshot is created; the clone must be
quiescent, and the report always says `migrationReady:false`. Historical identity
still requires authentic backups. No real library, provider, public deployment,
migration, activation, recovery benchmark or production-readiness claim was made.
