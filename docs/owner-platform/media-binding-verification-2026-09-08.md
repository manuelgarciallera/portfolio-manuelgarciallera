# Immutable media binding: isolated verification

Functional base `5a9619c`; implementation `3ccf011`. This is a local, opt-in
Payload fixture, not an activated storage provider or a production repair.
Independent review found no additional authorization or retention defect in this
scope and required a correction to the unit fixture's recursive cleanup. Fix
`4cd0c9b` uses only the known junction and empty directories. Scoped re-review
confirmed the finding addressed with no new breakage; 8/8 focused tests and file
lint passed. This closes the scoped binding review, not the activation gates.

A subsequent controller check found the same literal cleanup issue in the core
test fixture. Separate test-only correction `a79335b` passed 39/39 focused cases
and file lint. Scoped independent review confirmed exact owned-root, no-follow
per-entry removal and nonrecursive directory cleanup, with no new breakage.
Neither cleanup correction changed the production storage code.

## Implemented and exercised

- A complete original and its generated sizes share one immutable revision.
  Replacement retains the preceding bytes; restoring a stored version selects
  those bytes again. Metadata-only edits keep the revision.
- Guarded URLs associate the current media record, revision and exact filename.
  Anonymous reads are limited to the published revision; historical reads require
  owner and version access. Invalid or denied requests fail closed, with no native
  static-file fallback. Revocable responses use private/no-store caching.
- Restore authority comes from the actual Payload restore operation and stored
  version, not a caller's context flag. Forged metadata and reused authority are
  tested. Failed writes retain unreferenced revisions rather than deleting data
  whose transaction outcome cannot safely justify deletion.
- New preview captures store the exact media revision. Existing captures without
  it remain explicitly legacy/unverified and are not rewritten. This alone does
  not make publication exports self-contained or verify bytes at publication.

## Reported final checks on the implementation

| Check | Result | Scope |
| --- | --- | --- |
| Owner unit tests | 769/769, exit 0 | 144 files; 72.04 s |
| SQLite editorial integration | 31/31, exit 0 | Existing 23 plus 8 new media cases; 62.30 s |
| PostgreSQL editorial integration | 31/31, exit 0 | Fresh synthetic PostgreSQL 17.11; 37.99 s |
| Owner lint and types | Exit 0 | Final source/tests |
| Public boundary | Exit 0 | 21 entries |
| Isolation helper tests | 8/8, exit 0 | Not the complete provenance proof |
| Public bundle budget | Exit 0 | Existing build, ten routes, unchanged budget |
| Complete isolation evidence generator | Not passed | Missing dedicated PUBLIC_BUILD_DIR/provenance artifact |

The implementation report records real Fetch Request/Response endpoint tests,
not a listening HTTP server or a browser. It records expected denied-request
logs and the standard no-email-adapter warning. The existing intermittent SQLite
worker issue did not recur in this run; it has not thereby been declared fixed.

Controller inspection confirms no public source, root dependency or active
Payload configuration change in this increment. The original checkpoint remains
separate from these commits. No CV, real library, credentials or provider changed;
no deployment or new dependency was introduced.

## Separate isolation-contract finding

The generator also compares the root runtime manifest and lockfile exactly with
the original checkpoint `0f0adf686b2752e23c25d224f8c60815b10fd451`.
Controller inspection of `scripts/lib/owner-isolation.mjs` and the checkpoint
package diff found subsequent public changes: nodemailer and fflate overrides.
A new provenance artifact alone cannot resolve that historical mismatch.

This has been sent to the public lane for review in Hub message
`eb1ccca1-adb9-4168-9a31-14bdb278047f`. It is sent, not accepted or implemented.
No baseline, checkpoint or validation was weakened. The current boundary and
bundle results are limited evidence, not a passing full isolation proof.

## Required before activation

1. Exercise native crop/duplicate and delivery through a real authenticated HTTP
   socket, including draft/history/trash and revocation behavior.
2. Prove database plus all retained revisions can be backed up and restored.
3. Measure memory/concurrency and document storage permissions, retention growth,
   orphan reconciliation, migration and rollback.
4. Resolve publication dependencies and the hosting persistence decision before
   using this on the actual library. Do not equate this fixture with readiness for
   arbitrary customers or a multi-tenant service.

Next owner: Codex for the isolated media gates; Claude for review of the separate
public isolation-contract mismatch. Public design remains untouched.
