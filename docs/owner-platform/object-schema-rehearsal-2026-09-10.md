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

## Next gate / owner

Codex: test additive application against a populated legacy clone; reconcile
migration history; inventory/copy physical legacy media and every historical
reference; rehearse joint database/media backups and restore before provider
activation. Only then wire approved migration execution and staging acceptance.
Claude: review proposals through Hub, without concurrent repository edits.

No push, deployment, provider provisioning, purchase, real database changes or
public visual changes in this work. Public browser/production status was not
re-audited here. Existing checkpoint remains protected.
