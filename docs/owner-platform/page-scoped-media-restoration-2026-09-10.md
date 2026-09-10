# Page-scoped media restoration — local pilot

Base: 4e2987c. No production deployment or data migration.

## Behavior

The page now stores a hidden `restoredMediaSnapshot` relationship after restoration.
This identifies the verified capture whose image revisions it should display.
Restoration does not roll back shared Media rows or rewrite old snapshots.

Only a server-side request capability during restore can set the relationship.
The Pages beforeChange hook ignores client values and preserves the previous pin
on ordinary edits. A try/finally clears the capability even when writing fails.
The pin is included in Payload's page versions, alongside other page fields.

Preview capture and live editorial projection verify the snapshot hash and page
identity. They still require a current authorized Media read, then substitute the
captured metadata/revision for that page. Newly selected IDs absent from the capture
use current media. The visual presenter validates captured revision metadata, then
uses the private snapshot endpoint for pinned images. This also works when retention
removed the old Media version row but the capture still preserves the image.
The pre-commit comparison from 4e2987c remains as an independent safety check.

## Evidence

- RED: complete restoration rejected by the prior mismatch guard.
- GREEN full-config integration: restore revision A, visual preview URL and exact
  bytes A, shared Media remains revision B, normal title edit preserves A, forged
  REST update of restoredMediaSnapshot ignored.
- Reviewer found that the ordinary revision route fails after Media-version retention.
  RED reproduced with only revision-A rows removed from the synthetic database;
  corrected presenter uses the private capture route. The ordinary URL stays 404.
- Editorial suite separately: 23/23. One earlier combined run had an unexpected
  worker exit; it is not counted as a successful run.
- Unit suite: 1109/1109, including capability cleanup, wrong-page snapshot rejection,
  and newly selected media behavior. Typecheck and lint pass. Build: 23 pages.

## Not closed

- No browser run, PostgreSQL migration/restore run or real object storage cutover.
- Production requires an explicit migration adding the relationship to Pages and
  its versions, tested with backup/restore on PostgreSQL first. Do not run schema
  push against real data. Existing rows should begin with a null relationship.
- UI must explain the pinned image and offer an explicit safe return to the current
  library revision; that control is not implemented here.
- Legacy snapshots without verified versioned media remain blocked, never silently
  replaced by current bytes. Default application Media is still legacy storage.
- Brand profiles and crop recipes have separate versioning semantics; this change
  does not claim full visual restoration of every external dependency.
- If the captured binary is missing or unreadable, URL availability must be surfaced
  before confirming restoration. A valid manifest is not proof of live storage.

Codex next: explicit pin UX and negative storage cases, then
actual admin/browser and PostgreSQL acceptance. Claude reviews without writing.
