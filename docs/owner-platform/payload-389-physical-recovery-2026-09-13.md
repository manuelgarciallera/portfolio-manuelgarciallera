# Payload 3.89 candidate: full owner physical recovery

## Exact candidate and recoverability

Main repository remains on Payload 3.88.0; this is not a dependency integration
or deployment. Linux rehearsal source started at d5720ee, with the recorded 3.89
dependency lock, Vitest 4.1.11, bounded shutdown helper and its regression test.
Initialized Git metadata from a verified local bundle, without overwriting the
candidate files. Explicitly committed only those four changed files in that
isolated repository:

`ead7e79f369b4540398fd25d2fb2ffaf08017ef8`

The candidate commit also contains executable mode changes on those four files
introduced by Docker copy from Windows. They are not needed for the application;
normalize modes before any active integration rather than blindly cherry-picking.
Tracked diff against the candidate commit was empty after the recovery run.

Preserved `.audit/payload389-candidate-ead7e79.bundle`, verified complete Git history
(`80aca0`), SHA-256:
`BDE839DBA25C94C7996119D7B29F404F196768336FEC23DDA4CCD8D7C24DCA10`.
This is a local recoverable code artifact, not an external backup of production
data or an installed npm dependency cache.

## Verification performed

Command inside isolated Linux owner checkout:
`OWNER_POSTGRES_BIN=/usr/lib/postgresql/16/bin node scripts/test-recovery-postgres.mjs --object-media --full-owner`.

47 recovery-helper tests passed with Vitest 4.1.11. Then native PostgreSQL 16.15
pg_dump/pg_restore operated on new synthetic source/restored databases. Terminal
exit 0 (`6f55f1`) reports the exact candidate SHA above and:

- 18 backup files, 12 media files verified, three recovered revisions.
- 12 damage cases rejected before allocation; corrupt/missing archive rejected.
- Native migration installation, source logical state and receipts preserved.
- Login, history, frozen preview, independent edits and restore plan execution.
- Three page versions and two article versions recovered; both editable afterward.
- Migration copy verified, three retained files and three reconciled revisions.
- Payload sessions closed before dump; cluster stopped and this run root removed.

Subsequent process inventory shows only container init/sleep. No real accounts,
mail provider, public data, browser or production deployment were used. Earlier
failed integration fixture remains retained separately for its shutdown evidence.

## What remains

This proves synthetic full-owner recovery for the candidate, not production
backup operations, upgrade of an existing customer's database or browser/editor
acceptance. Before active integration: finish transitive dependency review,
review upstream security interpretation, normalize file modes, and rerun the
appropriate gates on the actual integrated SHA. Local browser access remains
subject to the user's previously requested authorization. Public checkpoint and
active dependency files remain unchanged.
