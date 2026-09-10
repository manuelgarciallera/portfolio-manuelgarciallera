# Optional object-storage schema rehearsal

Date: 2026-09-10. Base `2c86c21`. Hub reservation `a73a11e9`.

## Result and scope

Added the native optional PostgreSQL catalog under
`owner-platform/database/object-storage`. It imports the unchanged legacy baseline
and adds two nullable columns: `media.storage_revision` and
`_media_v.version_storage_revision`. No startup/deployment migration selection or
real environment changed. This is schema preparation, not migration of existing
files and not production activation.

The one-time offline generator uses the installed Payload/Drizzle implementation,
the existing native baseline snapshot and the real object-mode assembler. It uses
synthetic credentials and loopback endpoints, disables DB connection, asserts no
pool before/after generation, refuses an existing catalog and removes only its
validated temporary workspace. Generated down SQL is destructive and untested;
it must not be presented as a backup or operational rollback.

## Evidence

- Executable RED `ae8622`: legacy catalog leaves exactly the two object revision
  columns missing from the active native schema.
- Native offline generation `714bf8` succeeds; re-execution `8fcc10` refuses to
  overwrite migration history before loading application configuration.
- Focused PostgreSQL 17.11 run `520e81`: 2/2. Each mode installs in its own empty
  database with `push:false`; native schema matches, pages and versions survive
  repeating migrations, ledger remains one entry (legacy) or two (objects), and
  exact uploaded bytes remain available. Object fixture leaves scratch empty.
  Controller confirms process/session closure and cleanup.
- Read-only independent review: no blocking findings. Minor suggestions concern
  explicit Media metadata reread and nested fixture cleanup; no tests run by the
  reviewer. This review is not a production-readiness endorsement.
- Complete isolated integration run: 60/60 in 10 files, 146.87s (`0d89c6`),
  PostgreSQL 17.11 controller; auth-unlock explicitly uses SQLite. Terminal
  `14e18f` confirms all sessions/processes closed and synthetic cluster removed.
- Public dependency boundary: 21 app entries pass (`fc9d41`). No runtime application
  files changed, so no new build or browser verification claimed for this catalog.
- Typecheck and lint exit 0 (`0dc4c7`).

## Populated legacy upgrade follow-up

Base `3e29685`, reservation `acf979d2`. Extended the legacy branch after its
baseline, owner, image, draft page and versions already exist. The native runner
receives the combined catalog and applies only the unrecorded delta as batch 2;
the original baseline ledger row remains identical. SQL comparisons preserve
every seeded Media and Media-version field except the newly added nullable
columns. Those columns remain null: no historical byte identity is fabricated.
Repeated upgrade leaves the ledger unchanged; API rereads preserve Media, page
and page versions, and every filename and file buffer in the synthetic upload
directory is unchanged. Legacy runtime remains active throughout this rehearsal.

RED `e07abb` demonstrates the missing-column failure before invoking the upgrade.
Focused GREEN `d4bf2e` passes 2/2 with verified cluster cleanup. Initial typecheck
`afbaf0` found the native PostgreSQL migration signatures narrower than Payload's
cross-adapter `unknown` interface; explicit PostgreSQL boundary wrappers corrected
that mismatch. Types/lint then exit 0 (`274e29`). Independent read-only review
found no blockers. Nested cleanup now closes the provider even if Payload destroy
throws, and both modes explicitly reread Media metadata after migration repeat.
Final complete integration on the boundary-wrapper version: `26eb29`, 60/60 in
10 files, 167.16s, PostgreSQL 17.11 controller (auth-unlock uses SQLite explicitly).
The same terminal result confirms process/session closure and synthetic root
cleanup. Public boundary 21 entries and checkpoint remain intact (`57beff`).

This is a controlled populated synthetic schema, not an arbitrary installed
customer database or a restored production backup. Physical copy and historical
provenance are still separate, open gates.

## Remaining gate / owner

Codex: reconcile the actual installation's schema and migration history on an
authorized restored clone; inventory/copy physical legacy media and every historical
reference; rehearse joint database/media backups and restore before provider
activation. Only then wire approved migration execution and staging acceptance.
Claude: review proposals through Hub, without concurrent repository edits.

No push, deployment, provider provisioning, purchase, real database changes or
public visual changes in this work. Public browser/production status was not
re-audited here. Existing checkpoint remains protected.
