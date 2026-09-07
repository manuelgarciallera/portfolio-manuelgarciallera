# Recovery contract for immutable media

Read-only source analysis on `dbc37ae`, while native HTTP Task 3 is implemented.
This is acceptance guidance for dependent Task 4, not a completed recovery test.

## Existing proof and missing proof

The existing `tests/recovery/payload-worker.mjs` exercises actual owner login,
page edits, responsive placements and page versions. Its Media override enables
legacy flat local storage; `mediaEvidence` verifies only that document's current
original and derivatives. It does not create a replaced media revision, prove
historical bytes, or bind frozen previews to those bytes.

`scripts/test-recovery.mjs` waits for a seed process to close, copies SQLite and
media, rejects a corrupt backup before creating a restore destination, and opens
the restored application in another process. `test-recovery-postgres.mjs` uses
native pg_dump/pg_restore with no remaining Payload sessions and a fresh database.
Keep these existing proofs; do not relabel them as versioned-media verification.

`tests/recovery/backup-manifest.mjs` supports nested paths beneath `media/`, so a
private `media/revisions/<uuid>/...` fixture can include original, sizes and each
revision manifest without inventing another archive format. The manifest records
files, not empty directories: directory/revision inventory needs an explicit
comparison if incomplete empty attempts must also be accounted for. The helper is
test infrastructure for trusted, isolated roots, not a production backup API.

## Required new round trip

1. Seed a fresh isolated database and private revision root through the reviewed
   binding. Use real owner authentication and synthetic images. Preserve a
   published revision, a different draft revision, an older version, and a frozen
   preview referring to an exact revision. Include a retained failed-write attempt
   to prove backup is not limited to current database references.
2. Record independently checkable receipts: media/version/snapshot IDs, revision
   inventory and state, original/derivative names, byte lengths and SHA-256. Assert
   expected distinct revisions and expected image dimensions before taking the
   receipt; copying an unexplained result is not the acceptance test.
3. Quiesce the writer. Prove the worker closed and, for PostgreSQL, sessions ended
   before native dump and media copy. No claim of live concurrent snapshotting or
   filesystem/database atomicity from this offline fixture.
4. Copy the database and **entire retained revision tree**, including all revision
   manifests and unreferenced attempts. Corrupt/missing historical bytes or database
   artifacts must reject restore before allocating the target database/media root.
5. Restore to a new physical root and database. Reopen the actual binding in a new
   process with the same synthetic authentication secret. Check IDs, versions,
   frozen references and all file receipts, not only the current image.
6. Use authenticated HTTP to restore an old media version and download original
   and derivatives. Check published/draft/foreign and retained-orphan permissions
   again after recovery. Edit the restored copy independently; compare source and
   backup receipts afterwards to prove neither changed.

## Resource evidence to record separately

Measure an ordinary image set and a near-limit set through the real download
route, with serial and bounded concurrent requests. Record payload sizes,
concurrency, elapsed/latency method, Node/OS and RSS/external-buffer observations.
The current reader verifies the complete revision even for one small derivative;
the per-revision 64 MiB limit is not a process-wide memory budget. If this produces
a resource failure, add a tested production control before activation, preserving
integrity, permissions and cancellation semantics. Do not substitute a lightweight
mock benchmark or turn a single successful request into a scalability claim.

## Operational limits

- Immutable history consumes increasing disk space. Do not delete revisions just
  because no current row points to them: versions, snapshots and publication
  references may still require them. Reconciliation must distinguish complete,
  partial, referenced and unreferenced attempts; uncertain data remains retained.
- The OS must restrict write access to the private root; digests detect corruption,
  not an attacker allowed to rewrite both files and manifests. On Windows, check
  effective ACLs rather than assuming POSIX mode bits establish privacy.
- A local checkpoint is not an offsite database/media backup. Hosting durability,
  restore responsibilities, encryption and retention/cost still require an explicit
  operational choice before real data moves.
- Existing public/CMS configuration and the real library remain untouched. The CV
  and fonts require separate type-specific support; this image fixture does not
  authorize publishing them. Publication exports still need exact dependency
  closure, independently of the backup round trip.

Next owner: Codex, after Task 3 review. No provider, purchase, migration, public
deployment or new dependency is selected by this contract.
