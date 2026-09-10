-- Reviewed delta candidate, NOT an automatic migration or a fresh-install baseline.
-- Requires an approved backup and explicit single-schema search_path on a clone.
-- Baseline: Pages + version tables + PreviewSnapshots exist, neither new column exists.
-- A duplicate or incompatible schema fails; never conceal drift with IF NOT EXISTS.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "pages" ADD COLUMN "restored_media_snapshot_id" integer;
ALTER TABLE "_pages_v" ADD COLUMN "version_restored_media_snapshot_id" integer;

ALTER TABLE "pages" ADD CONSTRAINT "pages_restored_media_snapshot_fk"
  FOREIGN KEY ("restored_media_snapshot_id") REFERENCES "preview_snapshots" ("id") ON DELETE SET NULL;
ALTER TABLE "_pages_v" ADD CONSTRAINT "pages_v_restored_media_snapshot_fk"
  FOREIGN KEY ("version_restored_media_snapshot_id") REFERENCES "preview_snapshots" ("id") ON DELETE SET NULL;

CREATE INDEX "pages_restored_media_snapshot_idx" ON "pages" ("restored_media_snapshot_id");
CREATE INDEX "_pages_v_version_restored_media_snapshot_idx" ON "_pages_v" ("version_restored_media_snapshot_id");
COMMIT;
