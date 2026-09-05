# Assistance and Figma: actual persistence verification

## Scope and reproduced failures

This follow-up to `document-action-controls-verification.md` exercises the
private owner services against the actual Payload configuration and a temporary,
file-backed SQLite database. It does not enable external providers or change the
public portfolio.

The new regressions failed before each corresponding correction:

- Assistance proposal creation wrote the manifest's string page ID into a numeric
  relationship. The service now uses the typed ID from its authorized page read,
  and verifies that it matches the manifest's identity.
- Assistance decisions rejected Payload's merged immutable fields and timestamps
  as forbidden changes. The hook now validates the changed decision command and
  returns complete document fields. Unchanged JSON is compared structurally;
  changes to the patch, provider, author or target still fail. Direct API updates
  and deletion remain denied. Changing the original creation timestamp also
  fails; Payload's generated update timestamp is allowed.
- Figma review and execution creation likewise wrote URL strings into numeric
  relationships. Both now retain the authorized lookup's actual ID type, including
  string/UUID IDs, and use that type in canonical hashes and writes.
- A review without a note was stored with `null`; reconstructing its canonical
  hash rejected that optional value. Only the persisted absent note is normalized
  to `undefined`. Nonempty notes and integrity checks remain unchanged.

## What the tests actually exercise

Run `npm run test:integration` in `owner-platform`. The runner creates and cleans
its own temporary database, authenticates a synthetic owner, and runs real service
logic, collection hooks, access checks, relationships and transactions.

The assistance tests cover disabled capability rejection, enabling the permission,
proposal creation, both decision outcomes through URL IDs, immutable provenance,
repeated-decision rejection and denial of direct edits. The complete source page
remains unchanged. The provider is labelled `manual`: this is proposal persistence,
not a live Codex or other AI-provider session.

The Figma test substitutes only discovery and PNG download with a synthetic frame
and a small generated PNG. No Figma credential or network access is used. The test
prepares and approves a real plan, reads the absent note from SQLite, rejects a
changed source before download, imports draft media and its draft placement, and
rejects repeated execution. An injected final audit failure verifies rollback of
media, placement, execution and audit rows, plus media/placement version IDs,
before retrying successfully.

Upload local storage is disabled in this integration fixture so it never writes
to the owner's media library. The test proves database rollback, **not rollback
of external object storage or uploaded files**. Live Figma permissions, render
availability, production PostgreSQL and production storage remain separate gates.

Focused unit tests also cover numeric and UUID/string IDs, mismatched lookup
identities, merged Payload data, immutable-content mutation attempts, and
rejection when a previously hashed nonempty review note disappears. The actual
integration also attempts patch and creation-date mutations through trusted
Local API access to exercise hooks independently of the collection ACL.

During verification, several combined test runs terminated a Vitest worker
unexpectedly without an assertion failure or a diagnostic native stack. An
isolated verbose rerun completed all 13 integration tests. The intermittent
worker exit's cause has not been established; a clean rerun is not evidence that
this harness/environment issue is fixed.

## Boundaries retained

- No schema migration, dependency addition, deployment or public bridge change.
- The AI cannot apply, publish or deploy proposals through this flow.
- Figma discovery remains read-only; import creates private draft records.
- Existing approved checkpoint and public source remain untouched.
- Browser control tests are separate from service persistence tests; passing a
  simulated transport test is not presented as a live provider integration.

## Recorded verification

- Final `npm run check` completed successfully: 619 unit tests in 138 files,
  13 actual SQLite integration tests, ESLint, TypeScript and production owner
  build. The earlier intermittent worker termination is still recorded above.
- `npm run test:controls`: 18 desktop/mobile browser cases passed.
- Root public guards: 11 tests passed; all 20 public entry points remain isolated.
- Fresh public proof built from `49686b873adbfa13e16fbc9a987794c4184e6a21`
  plus this owner-only work: matching provenance, unchanged public input hash
  `d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`,
  unchanged runtime manifest/lockfile, and zero bundle regressions over nine routes.
- Independent read-only review found a creation-date mutation gap; its failing
  regression was reproduced, fixed and re-reviewed with no remaining findings.
- The protected checkpoint remains `0f0adf686b2752e23c25d224f8c60815b10fd451`.

## Transactional assistance follow-up

Three additional real SQLite regressions exposed partial assistance writes:
when creation auditing failed, a pending proposal was retained; when decision
auditing failed, the proposal nevertheless became accepted or rejected with
new decision metadata. All three failed before the correction.

Creation plus audit, and decision update plus audit, now execute using the same
Payload request transaction. A result is returned only after commit. An
operation/audit error triggers rollback; failure to start an owned transaction
returns HTTP 503 before writes. A transaction belonging to another caller is
neither committed nor rolled back by these services. Validation and owner checks
still precede mutation; no AI application, publication or external call is added.

The regressions verify proposal/audit counts after failed creation, exact stored
proposal equality after failed decisions (including timestamps and notes),
unchanged audit counts, and successful retry after failure. Database behavior
uses actual Payload transactions; unit fixtures inject the transaction boundary
only because their database operations are already substituted.

This establishes atomicity for the tested operation failures on SQLite. It does
not certify competing multi-client decisions under PostgreSQL, network failures
with ambiguous commit results, or automatic request retries. Those remain
separate production/concurrency verification work.

Follow-up verification: the final standard `npm run check` passed 621 unit
tests, 16 real SQLite integration tests, lint, typecheck and the owner build.
Three consecutive isolated diagnostic runs also passed all 16 integration
tests. Temporary fork-exit instrumentation observed only normal worker shutdowns
on those successful runs; it did not capture the intermittent failure and was
removed. The earlier process-exit issue remains unproven as fixed. Independent
read-only review reported no blocking findings in the transaction change.

The fresh public proof for `bd088ab44c918163265ea11ec94c8b5a64b48bbb` plus
this owner-only change passed: the same public input/runtime/lockfile hashes,
20 isolated entry points and zero bundle regressions across nine routes.
The 11 root public guard tests passed again. No deployment was performed.
