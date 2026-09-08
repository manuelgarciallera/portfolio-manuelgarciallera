# Task 2 report — owner-authorized Payload legacy-media inventory

Status: DONE. Implementation commit: `5273653` (`feat(owner): inventory legacy Payload media`).
Final resource fix: `c6746f6` (`fix(owner): bound Payload inventory paging`).
Task base: `bb2e5fa449e5e4d115a94d78021f4bbf0a487224`. The controller-only
decisions commit `180eef5` was concurrent and was not modified or included in the
implementation commit. The later controller-only retained-evidence ruling commit
`d45140d` is likewise separate from this implementation.

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
  10,000 declared rows on its first page. Rows are normalized as each page is
  consumed, and the global 10,000-reference cap is enforced before requesting
  another page; complete prior Payload pages are not accumulated. Empty snapshot
  rows remain source-bounded.
- A conservative shared 8 MiB retained-evidence budget counts UTF-8 pagination
  row IDs and serialized normalized references. Retained filename, filesize and
  revision fields must be scalar, and the existing 16-file-variant limit is
  enforced before accumulation. This fails closed on malformed legacy metadata
  rather than retaining nested or oversized Payload values across pages.
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
  seeding. The two document identities, one draft identity, one snapshot/media
  pair and all five independently captured version `{documentId, referenceId}`
  pairs are asserted exactly. The version parents are also checked as A/B twice,
  draft once and trash twice. The red-A version and old snapshot observe current B
  bytes without claiming historical identity.
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

## Review fix round 1/5

Review at `0bee13a` found that the real fixture constrained the total reference
count and red-A version but not the other four retained version identities. This
was a test-oracle gap in already-correct production behavior; no production file
was changed.

The fixture now captures the complete independent version identity set from the
seeded database after all media operations. It asserts exactly five version
pairs, the literal parent multiset (A/B twice, draft once, trash twice), five
collector version entries and exact equality of every `{documentId, referenceId}`
pair.

- RED sensitivity proof: a temporary test-only mutant omitted the first expected
  pair with `expectedVersionIdentities.slice(1)`. Command
  `npm run test:integration -- tests/legacy-media-inventory.integration.test.ts`,
  chunk `732fad`, exit `1`: `1/3` failed, with the diff identifying the omitted
  `{documentId:'1', referenceId:'1'}`. The mutant was fully reverted.
- SQLite GREEN: same focused command, chunk `b57b08`, exit `0`: `3/3` passed.
- PostgreSQL GREEN: `npm run test:integration:postgres --
  tests/legacy-media-inventory.integration.test.ts`, session `54815`, final chunk
  `ce1a86`, exit `0`: the unchanged runner executed its complete config, `4`
  files and `41/41` tests. It confirmed child close, zero remaining database
  sessions, exact PostgreSQL 17.11 cluster stop and removal of only its validated
  synthetic root.
- Changed-test lint plus full TypeScript `--noEmit`, chunk `9841bc`, exit `0`, no
  diagnostics.

The deferred Minor about the fixture-owned missing-email-adapter warning was not
changed in this fix loop. The PostgreSQL output retained that known warning and
the pre-existing negative media tests' intentional 400/403 logs. No new failure,
live session or cleanup concern remains.

## Final whole-increment resource fix

The final review at `fd4fb3c` found one Important issue: `collectPages` retained
every complete snapshot document before global reference normalization. A valid
source could therefore retain large manifests from all pages even when the final
report was small. The collector now validates pagination and duplicate IDs while
consuming each row immediately. It retains only normalized references, the row
IDs required to validate pagination uniqueness, and scalar counters/totals; the
global reference cap is applied before a subsequent page request.

The same pagewise architecture covers published Media, latest drafts, Media
versions and preview snapshots. The exact contract remains `limit:100`, at most
10,000 rows per source and at most 10,000 references globally, with
`overrideAccess:false` and all existing pagination validation unchanged.

Cross-layer retention review also established that the Payload/manifest boundary
could supply nested filename, filesize or revision values. Those retained fields
now fail closed unless scalar. The common conservative 8 MiB retained-evidence
budget counts both UTF-8 pagination IDs (including filtered rows) and serialized
normalized references before another page is fetched. File variants are rejected
above the existing Task 1 maximum of 16 (original plus 15 sizes) before an array
is accumulated. Primitive-but-invalid values remain available to Task 1's
authoritative validation; the collector does not reproduce its privacy, filename
or filesystem decisions. The 8 MiB accounting is deliberately conservative and
may reject malformed legacy data that Task 1 could otherwise reduce to a smaller
diagnostic. Controller ruling `d45140d` records that reconciliation cost.

### TDD and final gates

- Pagewise reference-limit RED: focused service test chunk `f424b7`, exit `1`.
  A first snapshot page normalized 10,100 references but the old collector still
  requested page 2. Initial pagewise GREEN: chunk `ad37d7`, `20/20`, exit `0`.
- Bounded-retention RED: chunk `3551a8`, exit `1`, `2/22` failures. Nested
  filename metadata reached Task 1 instead of failing closed, and 100 valid
  sub-1-MiB manifests with large scalar filenames requested page 2 before any
  retained-metadata bound fired. GREEN after scalar validation and the 8 MiB
  budget: chunk `81e1d3`, `22/22`, exit `0`.
- Final frozen-source unit command:
  `npm test -- --run src/media/legacy-media-inventory.test.ts src/media/legacy-media-inventory-service.test.ts`;
  chunk `e99bed`, exit `0`, `2` files and `97/97` tests.
- Final real SQLite fixture:
  `npm run test:integration -- tests/legacy-media-inventory.integration.test.ts`;
  chunk `e22e96`, exit `0`, `1` file and `3/3` tests.
- Final PostgreSQL command used the installed PostgreSQL 17.11 tools and the
  unchanged runner (which cannot safely scope to one integration file): session
  `26836`, final chunk `57f457`, exit `0`, `4` files and `41/41` tests. It
  confirmed ambient credentials ignored, test process and database sessions
  closed, exact cluster stopped and only its validated synthetic root removed.
- A preliminary exact-runner PostgreSQL pass before pagination IDs were charged
  to the retained-evidence budget also completed: session `92106`, final chunk
  `aaed8a`, exit `0`, `4` files and `41/41`. It was preserved rather than lost or
  replaced, but session `26836` is authoritative for `c6746f6`.
- Final changed-code ESLint: chunk `d323fa`, exit `0`, no output. Full TypeScript
  `--noEmit`: chunk `945ce4`, exit `0`, no diagnostics.

The known no-email-adapter fixture warning and intentional negative media-write
400/403 logs remain. No process, exec session, PostgreSQL database session or
synthetic test root remains. The final-review Minor about suppressing the
fixture-owned email warning remains explicitly deferred.

Per the controller's final-wave boundary, this agent did not rerun the full 877
unit suite, resource/recovery checks, public boundary or public build. The
controller owns one full-unit run after `c6746f6`; earlier complete/public results
in this report are not claimed as provenance for the final resource diff. No
production config, Task 1 core, public code, integration fixture, runner or
package changed in this final fix.

## Controller closure after final fix

Controller `npm test` on `c6746f6`: session `13367`, final chunk `2b5f2a`,
exit `0`, **880/880**, 146 files, 99.88 s. Scoped final re-review
`fd4fb3c..c6746f6` confirms the retained-pages finding addressed and no new
Critical/Important in the fix. The fixture email-warning Minor remains deferred.
Separate authorized public deployment and its own gates are recorded in
`docs/deployment-2026-09-08.md`; they do not activate the CMS storage.
