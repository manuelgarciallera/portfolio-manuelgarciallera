import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "storage_revision" varchar;
  ALTER TABLE "_media_v" ADD COLUMN "version_storage_revision" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "storage_revision";
  ALTER TABLE "_media_v" DROP COLUMN "version_storage_revision";`)
}
