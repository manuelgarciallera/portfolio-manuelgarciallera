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
