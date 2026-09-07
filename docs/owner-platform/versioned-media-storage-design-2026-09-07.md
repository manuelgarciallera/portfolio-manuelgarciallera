# Versioned media storage design

Status: implementation design within Manuel's approved CMS work, not approval to
migrate the real library, deploy, or purchase storage. Public design is unchanged.

## Observed defect

On `f14e052`, a synthetic media replacement succeeds but deletes the preceding
original and derivative files while the corresponding document version remains.
The focused editorial regression reproduces ENOENT. Payload 3.88's local update
operation calls `deleteAssociatedFiles` before validation/persistence. Restoring
only rows cannot repair this. Keeping all files under their original names also
fails when an image edit reuses the same name.

## Decision and alternatives

Use an immutable revision namespace for each complete upload. A revision groups
the original and derivatives with a checksum manifest, independent of the current
document. Metadata points at a revision; replacement creates a new revision;
restore selects the former one. File ownership and publication are separate.

Reject an after-save backup (too late on failure) and disabling replacement
(contradicts the requested editor). A cloud provider alone does not establish
historical retention: its deletion and overwrite behavior must be controlled.
Payload's official custom-storage integration is a candidate for the binding,
not installed or enabled by this design:
[official adapter documentation](https://payloadcms.com/docs/upload/storage-adapters),
[3.88 afterChange implementation](https://github.com/payloadcms/payload/blob/v3.88.0/packages/plugin-cloud-storage/src/hooks/afterChange.ts).

## Storage core contract

- `writeMediaRevision(root, files)` accepts an explicitly provisioned private
  local root and up to 16 named nonempty Buffer files, total at most 64 MiB.
- Allocate an unpredictable UUID revision directory exclusively. Never overwrite
  an existing revision or delete other data. Duplicate/case-colliding unsafe
  names, symlinks, special files and malformed roots fail closed.
- Write each file exclusively and flush it; write/flush the manifest last.
  A revision without a valid manifest is incomplete, never readable as complete.
- Manifest schema 1 contains revision ID, names, sizes and SHA-256. Reads validate
  the entire set, reject missing/extra/corrupt/linked files, and return only
  verified bytes. A digest detects accidental corruption, not an attacker who
  can rewrite both content and manifest.
- Interrupted writes are retained for reconciliation. No automatic garbage
  collection. Retention costs grow and need a later explicit policy that checks
  documents, versions and frozen publications before deletion.
- This is a bounded local building block, not filesystem/database atomicity,
  a replicated backup or a claim of power-loss durability on every filesystem.
  Root ownership and OS permissions must prevent hostile concurrent mutation.

## Binding and rollout gates

1. Prove the core against actual temporary files, including interrupted manifests
   and corruption, before connecting it to Payload.
2. Bind upload revisions to versioned media metadata through supported hooks or
   the official custom-storage plugin. Preserve editing, replacement, crop,
   duplicate, draft/published separation and restore. No arbitrary client-selected
   revision or direct anonymous filesystem route.
3. Actual HTTP access must check the exact revision against owner/publication
   rules; no draft exposure from a public document with a guessed revision URL.
4. SQLite and PostgreSQL must run replacement/restore/trash tests with originals
   and derivatives verified. Existing Figma compensation must recognize the new
   store and retain uncertain attempts without deleting historical bytes.
5. Migrate only after a tested database-plus-media backup, explicit storage
   selection, compatibility review and applicable authorization. Existing local
   files remain untouched while the isolated implementation is developed.

No PDFs, fonts, CV publication, cloud credentials or public dependencies in this
increment. The final CMS goal remains the full editable product; these gates do
not redefine success as a storage utility alone.
